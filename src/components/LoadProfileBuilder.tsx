import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Users, 
  Activity, 
  Shuffle, 
  BarChart3, 
  Sliders
} from 'lucide-react';
import { LoadPattern, LoadProfileConfig } from '../types';

interface LoadProfileBuilderProps {
  profile: LoadProfileConfig;
  onChange: (profile: LoadProfileConfig) => void;
}

export const LoadProfileBuilder: React.FC<LoadProfileBuilderProps> = ({ profile, onChange }) => {
  const patterns: { id: LoadPattern; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'constant',
      label: 'Constant Load',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      desc: 'Sustained fixed request rate & concurrency.'
    },
    {
      id: 'ramp',
      label: 'Ramp-Up / Staircase',
      icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
      desc: 'Linear acceleration from baseline to target load.'
    },
    {
      id: 'spike',
      label: 'Flash Sale / Spike',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      desc: 'Sudden burst spikes with cool-down periods.'
    },
    {
      id: 'diurnal',
      label: 'Diurnal Wave',
      icon: <BarChart3 className="w-4 h-4 text-purple-400" />,
      desc: 'Cyclic sinusoidal traffic simulating day/night patterns.'
    },
    {
      id: 'chaos',
      label: 'Chaos & Jitter',
      icon: <Shuffle className="w-4 h-4 text-rose-400" />,
      desc: 'Stochastic jitter bursts and high variance stress.'
    }
  ];

  // Generate 40 data points for the visual preview curve
  const curvePoints = useMemo(() => {
    const points: { time: number; rps: number }[] = [];
    const totalSec = Math.max(10, profile.durationSeconds || 20);
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalSec;
      let rps = profile.targetRps;

      if (profile.pattern === 'constant') {
        rps = profile.targetRps;
      } else if (profile.pattern === 'ramp') {
        if (t < profile.rampUpSeconds) {
          rps = profile.initialRps + ((profile.targetRps - profile.initialRps) * (t / Math.max(1, profile.rampUpSeconds)));
        } else if (t > totalSec - profile.rampDownSeconds) {
          const rem = totalSec - t;
          rps = profile.initialRps + ((profile.targetRps - profile.initialRps) * (rem / Math.max(1, profile.rampDownSeconds)));
        } else {
          rps = profile.targetRps;
        }
      } else if (profile.pattern === 'spike') {
        const cycle = t % Math.max(2, profile.spikeIntervalSeconds || 10);
        if (cycle < profile.spikeDurationSeconds) {
          rps = profile.peakRps || profile.targetRps * 2.5;
        } else {
          rps = profile.targetRps;
        }
      } else if (profile.pattern === 'diurnal') {
        const freq = (t / totalSec) * Math.PI * 3;
        const normalizedSin = (Math.sin(freq) + 1) / 2;
        rps = profile.initialRps + (profile.peakRps - profile.initialRps) * normalizedSin;
      } else if (profile.pattern === 'chaos') {
        const base = profile.targetRps;
        const jitter = (Math.sin(t * 1.5) + Math.cos(t * 3.7)) * (profile.chaosJitterPct / 100) * base;
        rps = Math.max(1, base + jitter);
      }

      points.push({ time: Math.round(t), rps: Math.round(rps) });
    }
    return points;
  }, [profile]);

  // Compute SVG polygon for curve visualization
  const maxRpsValue = Math.max(...curvePoints.map(p => p.rps), 10);
  const svgWidth = 400;
  const svgHeight = 100;

  const pathData = curvePoints.reduce((acc, point, index) => {
    const x = (index / (curvePoints.length - 1)) * svgWidth;
    const y = svgHeight - (point.rps / maxRpsValue) * (svgHeight - 15) - 10;
    return `${acc} ${index === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  const areaData = `${pathData} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <div className="space-y-6">
      {/* Pattern Selector Cards */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
          Select Traffic Shape & Load Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {patterns.map((item) => {
            const isSelected = profile.pattern === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ ...profile, pattern: item.id })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {item.icon}
                  <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Curve Chart Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">Simulated Target Load Curve (RPS over Time)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Duration: <strong className="text-slate-200">{profile.durationSeconds}s</strong></span>
            <span>Target: <strong className="text-cyan-300">{profile.targetRps} req/s</strong></span>
            {profile.pattern !== 'constant' && (
              <span>Peak: <strong className="text-amber-300">{profile.peakRps || profile.targetRps} req/s</strong></span>
            )}
          </div>
        </div>

        <div className="relative h-28 w-full bg-slate-950/60 rounded-lg p-2 overflow-hidden border border-slate-800/60 flex items-center justify-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="25" x2={svgWidth} y2="25" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
            <line x1="0" y1="50" x2={svgWidth} y2="50" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
            <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
            
            {/* Area & Line */}
            <path d={areaData} fill="url(#curveGradient)" />
            <path d={pathData} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Overlay tags */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-cyan-500/20">
            {profile.pattern.toUpperCase()} MODE
          </div>
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
            Max: ~{maxRpsValue} RPS
          </div>
        </div>
      </div>

      {/* Numerical Load Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Test Duration */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Test Duration
            </label>
            <span className="text-xs font-mono font-semibold text-cyan-300">{profile.durationSeconds}s</span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={profile.durationSeconds}
            onChange={(e) => onChange({ ...profile, durationSeconds: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>5s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Target RPS */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Target Rate (RPS)
            </label>
            <span className="text-xs font-mono font-semibold text-emerald-400">{profile.targetRps} req/s</span>
          </div>
          <input
            type="range"
            min="1"
            max="300"
            step="5"
            value={profile.targetRps}
            onChange={(e) => onChange({ ...profile, targetRps: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 RPS</span>
            <span>150 RPS</span>
            <span>300 RPS</span>
          </div>
        </div>

        {/* Concurrency Limit (Virtual Users) */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Max Concurrency (VUs)
            </label>
            <span className="text-xs font-mono font-semibold text-indigo-300">{profile.concurrencyLimit} users</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={profile.concurrencyLimit}
            onChange={(e) => onChange({ ...profile, concurrencyLimit: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 VU</span>
            <span>50 VUs</span>
            <span>100 VUs</span>
          </div>
        </div>

        {/* Request Timeout */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Timeout Threshold
            </label>
            <span className="text-xs font-mono font-semibold text-amber-300">{profile.timeoutMs}ms</span>
          </div>
          <input
            type="range"
            min="500"
            max="15000"
            step="500"
            value={profile.timeoutMs}
            onChange={(e) => onChange({ ...profile, timeoutMs: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>500ms</span>
            <span>5000ms</span>
            <span>15s</span>
          </div>
        </div>
      </div>

      {/* Pattern-Specific Advanced Settings */}
      {profile.pattern === 'ramp' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Initial Baseline (RPS)</label>
            <input
              type="number"
              min="1"
              value={profile.initialRps}
              onChange={(e) => onChange({ ...profile, initialRps: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Ramp-Up Duration (s)</label>
            <input
              type="number"
              min="1"
              max={profile.durationSeconds - 2}
              value={profile.rampUpSeconds}
              onChange={(e) => onChange({ ...profile, rampUpSeconds: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Ramp-Down Duration (s)</label>
            <input
              type="number"
              min="0"
              value={profile.rampDownSeconds}
              onChange={(e) => onChange({ ...profile, rampDownSeconds: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      )}

      {profile.pattern === 'spike' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Peak Spike Rate (RPS)</label>
            <input
              type="number"
              min={profile.targetRps}
              value={profile.peakRps}
              onChange={(e) => onChange({ ...profile, peakRps: Math.max(profile.targetRps, parseInt(e.target.value, 10) || 50) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Spike Interval (Every N sec)</label>
            <input
              type="number"
              min="3"
              value={profile.spikeIntervalSeconds}
              onChange={(e) => onChange({ ...profile, spikeIntervalSeconds: Math.max(3, parseInt(e.target.value, 10) || 8) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Spike Burst Duration (s)</label>
            <input
              type="number"
              min="1"
              value={profile.spikeDurationSeconds}
              onChange={(e) => onChange({ ...profile, spikeDurationSeconds: Math.max(1, parseInt(e.target.value, 10) || 2) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {profile.pattern === 'chaos' && (
        <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-200 block mb-1">Stochastic Jitter & Variance Percentage ({profile.chaosJitterPct}%)</label>
            <p className="text-[11px] text-slate-400">Randomly modulates request pacing to create unpredictability and test microservice queue recovery.</p>
          </div>
          <input
            type="range"
            min="5"
            max="80"
            step="5"
            value={profile.chaosJitterPct}
            onChange={(e) => onChange({ ...profile, chaosJitterPct: parseInt(e.target.value, 10) })}
            className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      )}
    </div>
  );
};
