import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Globe,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  X,
  Layers,
  Crown,
  Activity,
  Check
} from 'lucide-react';
import { MemberUser, MemberTier } from '../types';
import { registerMember, loginMember, loginWithGoogle } from '../utils/authManager';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: MemberUser, token: string) => void;
  initialMode?: 'login' | 'register';
  isGate?: boolean; // When true, behaves as a mandatory login/registration gate before use
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  isGate = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regTier, setRegTier] = useState<MemberTier>('pro');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google login modal/sheet state
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');
  const [googleAdminPasscode, setGoogleAdminPasscode] = useState('');
  const [needsAdminPasscode, setNeedsAdminPasscode] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginMember(loginEmail, loginPassword);
      if (res.success && res.user && res.token) {
        setSuccessMessage(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(res.user!, res.token!);
          if (onClose) onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (regPassword.length < 5) {
      setErrorMessage('Password must be at least 5 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerMember({
        name: regName,
        email: regEmail,
        password: regPassword,
        company: regCompany,
        targetWebsite: regWebsite,
        tier: regTier,
      });

      if (res.success && res.user && res.token) {
        setSuccessMessage(`Registration complete! Welcome to TrafficPulse, ${res.user.name}.`);
        setTimeout(() => {
          onAuthSuccess(res.user!, res.token!);
          if (onClose) onClose();
        }, 700);
      } else {
        setErrorMessage(res.error || 'Failed to create membership. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginMember(email, pass);
      if (res.success && res.user && res.token) {
        setSuccessMessage(`Logged in as ${res.user.role === 'admin' ? 'Super Admin' : 'member'}: ${res.user.name}`);
        setTimeout(() => {
          onAuthSuccess(res.user!, res.token!);
          if (onClose) onClose();
        }, 400);
      } else {
        setErrorMessage(res.error || 'Failed to login with account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = (googleInputEmail || (mode === 'register' && regEmail ? regEmail : '')).trim().toLowerCase();
    
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorMessage('Please enter a valid Google Account email (e.g., yourname@gmail.com).');
      return;
    }

    const isClaimingAdmin = emailToUse === 'saroneedam@yahoo.com' || emailToUse === 'saroneedam@gmail.com' || emailToUse.includes('saroneedam');
    if (isClaimingAdmin && !googleAdminPasscode && !needsAdminPasscode) {
      setNeedsAdminPasscode(true);
      setErrorMessage('Security verification required: Enter the Super Admin master passcode to verify administrative ownership.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const targetName = googleInputName || (mode === 'register' && regName ? regName : emailToUse.split('@')[0]);
      const res = await loginWithGoogle({
        email: emailToUse,
        name: targetName,
        adminPasscode: googleAdminPasscode,
      });

      if (res.success && res.user && res.token) {
        setSuccessMessage(`Google Verified: Welcome, ${res.user.name} (${res.user.role === 'admin' ? 'Super Admin' : 'Verified Member'})!`);
        setTimeout(() => {
          onAuthSuccess(res.user!, res.token!);
          if (onClose) onClose();
        }, 400);
      } else {
        if (res.requiresAdminPasscode) {
          setNeedsAdminPasscode(true);
        }
        setErrorMessage(res.error || 'Google login could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Close Button (only if not a strict blocking gate) */}
        {!isGate && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">TrafficPulse</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                MEMBERS PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {isGate
                ? 'Please register or log in to your member account before generating autonomous traffic, configuring custom visit caps, and running site crawlers.'
                : 'Access member-only features, custom visitor volume caps, residential proxy routing, and real-time GA4 sessions.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Member Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Register & Join Membership</span>
          </button>
        </div>

        {/* Google Login Section */}
        <div className="space-y-3">
          {!showGooglePrompt ? (
            <button
              type="button"
              onClick={() => {
                setShowGooglePrompt(true);
                setErrorMessage(null);
              }}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-3 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 group"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="font-semibold">Sign In with Google Account</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold uppercase tracking-wider ml-auto">
                Verified OAuth
              </span>
            </button>
          ) : (
            <form onSubmit={handleGoogleAuthSubmit} className="p-3.5 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="text-xs font-bold text-slate-200">Google Account Authentication</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., yourname@gmail.com"
                    value={googleInputEmail}
                    onChange={(e) => {
                      setGoogleInputEmail(e.target.value);
                      if (e.target.value.toLowerCase().includes('saroneedam')) {
                        setNeedsAdminPasscode(true);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Alex Johnson"
                    value={googleInputName}
                    onChange={(e) => setGoogleInputName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {(needsAdminPasscode || googleInputEmail.toLowerCase().includes('saroneedam')) && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin Passkey Verification Required</span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Saroneedam Super Admin access requires the Master Passkey to prevent unauthorized privilege elevation.
                    </p>
                    <input
                      type="password"
                      placeholder="Enter Admin Passkey (Vivian123@)"
                      value={googleAdminPasscode}
                      onChange={(e) => setGoogleAdminPasscode(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating with Google...' : 'Verify & Continue with Google'}
              </button>
            </form>
          )}

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Or sign in with email credentials
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., saroneedam@yahoo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your member password (e.g. Vivian123@)"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Member Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo & Admin Logins */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>1-Click Member & Admin Accounts:</span>
                <span className="text-[10px] text-emerald-400 font-mono">Instant Access</span>
              </div>
              
              {/* Saroneedam Super Admin Account Card */}
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('saroneedam@yahoo.com');
                  setLoginPassword('Vivian123@');
                  handleQuickDemoLogin('saroneedam@yahoo.com', 'Vivian123@');
                }}
                className="w-full p-2.5 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 hover:from-amber-950/70 border border-amber-500/50 hover:border-amber-400 rounded-xl text-left cursor-pointer transition-all group shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-amber-500/50 shrink-0 bg-slate-950">
                    <img src="/admin-avatar.jpg" alt="Saroneedam Admin" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-200 group-hover:text-amber-100">Saroneedam (Super Admin)</span>
                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">saroneedam@yahoo.com • Pass: Vivian123@</p>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold px-2 py-1 rounded bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  Login Admin →
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('alex@trafficpulse.io');
                    setLoginPassword('pro123');
                    handleQuickDemoLogin('alex@trafficpulse.io', 'pro123');
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">Alex Mercer</span>
                    <span className="text-[9px] font-bold bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">PRO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">alex@trafficpulse.io</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('sarah@growthwave.agency');
                    setLoginPassword('growth123');
                    handleQuickDemoLogin('sarah@growthwave.agency', 'growth123');
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">Sarah Chen</span>
                    <span className="text-[9px] font-bold bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">ENTERPRISE</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">sarah@growthwave.agency</p>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* MODE: REGISTER / JOIN */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-3">
              {/* Member Tier Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Select Membership Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setRegTier('starter')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      regTier === 'starter'
                        ? 'bg-slate-950 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Starter</span>
                      {regTier === 'starter' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">Up to 25k visits/run</p>
                  </div>

                  <div
                    onClick={() => setRegTier('pro')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all relative ${
                      regTier === 'pro'
                        ? 'bg-slate-950 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 text-[8px] uppercase font-extrabold bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                      POPULAR
                    </span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-300">Pro Member</span>
                      {regTier === 'pro' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">250k+ custom visits</p>
                  </div>

                  <div
                    onClick={() => setRegTier('enterprise')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      regTier === 'enterprise'
                        ? 'bg-slate-950 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-cyan-300">Enterprise</span>
                      {regTier === 'enterprise' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">Unlimited custom</p>
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Okafor"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Company & Target Website (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company / Team (Optional)</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Media Agency"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Default Target URL (Optional)</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://jobs.eezor.com"
                      value={regWebsite}
                      onChange={(e) => setRegWebsite(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Create Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 5 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Member Perks Checklist */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Member Privileges Included:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">✓ Unlimited Custom Visit Cap input</span>
                <span className="flex items-center gap-1">✓ Full Site Crawler & Radar Graph</span>
                <span className="flex items-center gap-1">✓ Residential Multi-Country IP Pool</span>
                <span className="flex items-center gap-1">✓ Realistic GA4 In-Article Clicks</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Registering Member...</span>
              ) : (
                <>
                  <span>Join TrafficPulse & Unlock Member Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
