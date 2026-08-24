import React from 'react';
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
  Users
} from 'lucide-react';
import { TrafficConfig, OrganicVisitorConfig } from '../types';
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
}) => {
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

        {/* Right: Primary Run Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {appMode === 'organic' ? (
            isOrganicRunning ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {activeVisitorsCount} Active Visitors
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onStopOrganic}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Traffic</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartOrganic}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Traffic Generator</span>
              </button>
            )
          ) : (
            isStressRunning ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono font-medium text-rose-300">
                    {elapsedSeconds}s / {stressConfig.loadProfile.durationSeconds}s
                  </span>
                </div>
                <button
                  onClick={onStopStress}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Test</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onStartStress}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow cursor-pointer"
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
