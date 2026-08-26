import React, { useState } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  Sparkles, 
  Globe, 
  Zap, 
  Layers, 
  History, 
  Code, 
  Database,
  Compass,
  Users,
  User,
  LogOut,
  ChevronDown,
  Crown,
  ShieldCheck,
  Lock,
  Camera,
  Settings,
  UserCheck
} from 'lucide-react';
import { TrafficConfig, OrganicVisitorConfig, MemberUser } from '../types';
import { TRAFFIC_PRESETS } from '../data/presets';
import { ORGANIC_PRESETS } from '../data/organicPresets';

interface NavbarProps {
  appMode: 'organic' | 'stress';
  onSwitchAppMode: (mode: 'organic' | 'stress') => void;
  // Organic Mode Props
  organicConfig: OrganicVisitorConfig;
  onSelectOrganicPreset: (presetId: string) => void;
  isOrganicRunning: boolean;
  activeVisitorsCount: number;
  onStartOrganic: () => void;
  onStopOrganic: () => void;
  onOpenAiOrganic: () => void;
  // Stress Mode Props
  stressConfig: TrafficConfig;
  setStressConfig: (config: TrafficConfig) => void;
  isStressRunning: boolean;
  elapsedSeconds: number;
  onStartStress: () => void;
  onStopStress: () => void;
  onOpenAiStress: () => void;
  onOpenSandbox: () => void;
  onOpenExport: () => void;
  onOpenHistory: () => void;
  // Auth Props
  currentUser?: MemberUser | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenProfileEdit?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  appMode,
  onSwitchAppMode,
  organicConfig,
  onSelectOrganicPreset,
  isOrganicRunning,
  activeVisitorsCount,
  onStartOrganic,
  onStopOrganic,
  onOpenAiOrganic,
  stressConfig,
  setStressConfig,
  isStressRunning,
  elapsedSeconds,
  onStartStress,
  onStopStress,
  onOpenAiStress,
  onOpenSandbox,
  onOpenExport,
  onOpenHistory,
  currentUser,
  onOpenAuth,
  onOpenProfileEdit,
  onLogout,
}) => {
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isRunning = appMode === 'organic' ? isOrganicRunning : isStressRunning;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand + App Mode Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">TrafficPulse</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL VISITOR
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Organic & Social Human Traffic Generator</p>
            </div>
          </div>

          {/* Mode Selector Pill */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onSwitchAppMode('organic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                appMode === 'organic'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Organic & Social Crawler</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchAppMode('stress')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                appMode === 'stress'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>API Load Stress</span>
            </button>
          </div>
        </div>

        {/* Center: Presets & AI Tools */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          {appMode === 'organic' ? (
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-950 text-xs text-slate-200 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
                onChange={(e) => onSelectOrganicPreset(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Load Organic Preset...</option>
                {ORGANIC_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onOpenAiOrganic}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI SEO Architect</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAiStress}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Stress Load</span>
              </button>
              <button
                onClick={onOpenSandbox}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sandbox</span>
              </button>
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export</span>
              </button>
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>History</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Member Profile & Primary Run Trigger */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Member Authentication Status Pill / Button */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left cursor-pointer transition-all shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        {getInitials(currentUser.name)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">{currentUser.name}</span>
                    <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      {currentUser.role === 'admin' ? 'ADMIN' : currentUser.tier}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-2xl z-50 animate-fadeIn">
                  {/* User Header */}
                  <div className="pb-3 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shrink-0 shadow-md">
                      <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
                        {currentUser.avatar ? (
                          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {getInitials(currentUser.name)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                          {currentUser.role === 'admin' ? 'Super Admin' : `${currentUser.tier}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                      {currentUser.company && (
                        <p className="text-[10px] text-slate-500 truncate">{currentUser.company}</p>
                      )}
                    </div>
                  </div>

                  {/* Edit Profile & Photo Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenProfileEdit) onOpenProfileEdit();
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-between transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit Profile & Photo</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Settings
                    </span>
                  </button>

                  {/* User Stats & Quota */}
                  <div className="space-y-1.5 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-slate-400">
                      <span>Visits Quota:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {currentUser.customVisitsLimit ? `${currentUser.customVisitsLimit.toLocaleString()}` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Campaigns Run:</span>
                      <span className="font-mono text-slate-200">{currentUser.totalCampaignsRun}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Visits Made:</span>
                      <span className="font-mono text-cyan-400">{(currentUser.totalVisitsGenerated || 0).toLocaleString()}</span>
                    </div>
                    {currentUser.targetWebsite && (
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                        <span className="truncate">Default Target:</span>
                        <span className="font-mono text-[10px] text-slate-300 truncate max-w-[120px]" title={currentUser.targetWebsite}>
                          {currentUser.targetWebsite.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenAuth) onOpenAuth('register');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Switch Account</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('register')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Join</span>
              </button>
            </div>
          )}

          {appMode === 'organic' ? (
            isOrganicRunning ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {activeVisitorsCount} Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onStopOrganic}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartOrganic}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Traffic</span>
              </button>
            )
          ) : (
            isStressRunning ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono font-medium text-rose-300">
                    {elapsedSeconds}s / {stressConfig.loadProfile.durationSeconds}s
                  </span>
                </div>
                <button
                  onClick={onStopStress}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onStartStress}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate Load</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
