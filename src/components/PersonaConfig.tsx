import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  Bot, 
  Globe2, 
  ShieldCheck, 
  Shuffle, 
  Wifi
} from 'lucide-react';
import { PersonaConfig } from '../types';

interface PersonaConfigViewProps {
  persona: PersonaConfig;
  onChange: (persona: PersonaConfig) => void;
}

export const PersonaConfigView: React.FC<PersonaConfigViewProps> = ({ persona, onChange }) => {
  const handleDeviceChange = (key: keyof typeof persona.devices, val: number) => {
    onChange({
      ...persona,
      devices: {
        ...persona.devices,
        [key]: val,
      },
    });
  };

  const handleRegionWeightChange = (index: number, weight: number) => {
    const updated = [...persona.regions];
    updated[index] = { ...updated[index], weight };
    onChange({ ...persona, regions: updated });
  };

  const handleRegionLatencyChange = (index: number, simulatedLatencyMs: number) => {
    const updated = [...persona.regions];
    updated[index] = { ...updated[index], simulatedLatencyMs };
    onChange({ ...persona, regions: updated });
  };

  return (
    <div className="space-y-6">
      {/* Device Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Laptop className="w-4 h-4 text-cyan-400" />
            Synthetic Client & Device Distribution
          </label>
          <span className="text-[11px] text-slate-400">
            Total Weight: {(Object.values(persona.devices) as number[]).reduce((a, b) => a + b, 0)}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Desktop Chrome */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" /> Desktop Chrome
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">{persona.devices.desktopChrome}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={persona.devices.desktopChrome}
              onChange={(e) => handleDeviceChange('desktopChrome', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Desktop Safari */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-blue-400" /> Desktop Safari / Mac
              </span>
              <span className="text-xs font-mono font-bold text-blue-400">{persona.devices.desktopSafari}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={persona.devices.desktopSafari}
              onChange={(e) => handleDeviceChange('desktopSafari', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Mobile iOS */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile iOS Safari
              </span>
              <span className="text-xs font-mono font-bold text-indigo-400">{persona.devices.mobileIos}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={persona.devices.mobileIos}
              onChange={(e) => handleDeviceChange('mobileIos', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Mobile Android */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile Android Chrome
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{persona.devices.mobileAndroid}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={persona.devices.mobileAndroid}
              onChange={(e) => handleDeviceChange('mobileAndroid', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Bot / Crawler */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" /> Bot / Search Crawler
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">{persona.devices.botCrawler}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={persona.devices.botCrawler}
              onChange={(e) => handleDeviceChange('botCrawler', parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Global Regional Latencies */}
      <div>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          Simulated Regional Origin & Latency
        </label>

        <div className="space-y-3">
          {persona.regions.map((reg, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-[180px]">
                <span className="text-xs font-medium text-slate-200 block">{reg.region}</span>
                <span className="text-[10px] text-slate-400">Traffic Share: {reg.weight}%</span>
              </div>

              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Added Regional Latency</span>
                    <span className="font-mono text-cyan-300 font-medium">+{reg.simulatedLatencyMs}ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={reg.simulatedLatencyMs}
                    onChange={(e) => handleRegionLatencyChange(idx, parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Behavior Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <label className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-850">
          <input
            type="checkbox"
            checked={persona.randomizeIp}
            onChange={(e) => onChange({ ...persona, randomizeIp: e.target.checked })}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <div>
            <span className="text-xs font-medium text-slate-200 block">Randomize Client IP</span>
            <span className="text-[10px] text-slate-400">Injects synthetic X-Forwarded-For</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-850">
          <input
            type="checkbox"
            checked={persona.enableKeepAlive}
            onChange={(e) => onChange({ ...persona, enableKeepAlive: e.target.checked })}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <div>
            <span className="text-xs font-medium text-slate-200 block">HTTP Keep-Alive</span>
            <span className="text-[10px] text-slate-400">Reuses TCP connection socket pool</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-850">
          <input
            type="checkbox"
            checked={persona.followRedirects}
            onChange={(e) => onChange({ ...persona, followRedirects: e.target.checked })}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <div>
            <span className="text-xs font-medium text-slate-200 block">Follow 3xx Redirects</span>
            <span className="text-[10px] text-slate-400">Auto-navigate location headers</span>
          </div>
        </label>
      </div>
    </div>
  );
};
