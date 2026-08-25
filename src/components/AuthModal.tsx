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
import { registerMember, loginMember } from '../utils/authManager';

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
        setSuccessMessage(`Logged in as demo member: ${res.user.name}`);
        setTimeout(() => {
          onAuthSuccess(res.user!, res.token!);
          if (onClose) onClose();
        }, 400);
      } else {
        setErrorMessage(res.error || 'Failed to login with demo account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login error.');
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
                    placeholder="e.g., alex@trafficpulse.io"
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
                    placeholder="Enter your member password"
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

            {/* Quick Demo Logins for Fast Review */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>Fast 1-Click Demo Accounts:</span>
                <span className="text-[10px] text-emerald-400 font-mono">Instant Access</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('alex@trafficpulse.io', 'pro123')}
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
                  onClick={() => handleQuickDemoLogin('sarah@growthwave.agency', 'growth123')}
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
