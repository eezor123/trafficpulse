import React, { useState } from 'react';
import { 
  Clock, 
  MousePointer, 
  Activity, 
  Zap, 
  Layers, 
  ArrowDownUp, 
  ShieldCheck, 
  Sliders, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Link2, 
  Megaphone, 
  FileText, 
  MousePointerClick, 
  Sparkle,
  Smartphone,
  Cpu,
  Wifi
} from 'lucide-react';
import { Ga4TrackerConfig, VisitorBehaviorConfig, MemberUser } from '../types';

interface BehaviorConfigPanelProps {
  behavior: VisitorBehaviorConfig;
  ga4: Ga4TrackerConfig;
  onChangeBehavior: (behavior: VisitorBehaviorConfig) => void;
  onChangeGa4: (ga4: Ga4TrackerConfig) => void;
  onSaveSettings?: () => void;
  onResetDefaults?: () => void;
  currentUser?: MemberUser | null;
  onOpenAuth?: () => void;
}

export const BehaviorConfigPanel: React.FC<BehaviorConfigPanelProps> = ({
  behavior,
  ga4,
  onChangeBehavior,
  onChangeGa4,
  onSaveSettings,
  onResetDefaults,
  currentUser,
  onOpenAuth,
}) => {
  const [testPingStatus, setTestPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testClickPingStatus, setTestClickPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [customVisitsMode, setCustomVisitsMode] = useState<'slider' | 'custom' | 'presets'>('custom');
  const [customVisitsInput, setCustomVisitsInput] = useState<string>(
    behavior.targetTotalVisits ? String(behavior.targetTotalVisits) : '0'
  );
  const [customPageViewsInput, setCustomPageViewsInput] = useState<string>(
    behavior.targetTotalPageViews ? String(behavior.targetTotalPageViews) : '0'
  );

  const handleTestGa4Ping = async () => {
    setTestPingStatus('testing');
    try {
      const res = await fetch('/api/ga4/collect-beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementId: ga4.measurementId || 'G-TESTPING123',
          apiSecret: ga4.apiSecret || undefined,
          eventName: 'page_view',
          pageTitle: 'TrafficPulse GA4 Validation Ping',
          pageLocation: 'https://example.com/test-ping',
          pagePath: '/test-ping',
          referrer: 'https://www.google.com/search?q=organic+traffic+boost',
          engagementTimeMs: 30000,
          countryCode: 'US',
          campaignSource: 'google',
          campaignMedium: 'organic',
          campaignName: 'Organic Traffic Test',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestPingStatus('success');
        setTimeout(() => setTestPingStatus('idle'), 4000);
      } else {
        setTestPingStatus('failed');
      }
    } catch {
      setTestPingStatus('failed');
    }
  };

  const handleTestGa4ClickPing = async () => {
    setTestClickPingStatus('testing');
    try {
      const res = await fetch('/api/ga4/collect-beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementId: ga4.measurementId || 'G-TESTPING123',
          apiSecret: ga4.apiSecret || undefined,
          eventName: 'click',
          pageTitle: 'TrafficPulse GA4 Click Event Validation',
          pageLocation: 'https://example.com/job/sample-posting',
          pagePath: '/job/sample-posting',
          referrer: 'https://www.google.com/search?q=jobs',
          engagementTimeMs: 15000,
          hitSequence: 2,
          countryCode: 'US',
          campaignSource: 'google',
          campaignMedium: 'organic',
          campaignName: 'Organic Traffic Test',
          clickParams: {
            linkUrl: 'https://jobs.partner.com/apply/101',
            linkText: 'Apply Now (Simulated Click Test)',
            outbound: true,
            linkDomain: 'jobs.partner.com',
            linkClasses: 'btn-apply-job cta-outbound',
            linkId: 'btn_apply_test_101',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestClickPingStatus('success');
        setTimeout(() => setTestClickPingStatus('idle'), 4000);
      } else {
        setTestClickPingStatus('failed');
      }
    } catch {
      setTestClickPingStatus('failed');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Human Dwell, Multi-Page Browsing, Links & Ads Engine</h2>
            <p className="text-xs text-slate-400">
              Simulates realistic reading dwell times, scroll depths, in-post link clicks, banner/popup ad clicks, and Google Analytics beacons.
            </p>
          </div>
        </div>

        {/* Speed Multiplier & Save Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Pacing:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 5, 10].map((multiplier) => (
                <button
                  key={multiplier}
                  type="button"
                  onClick={() => onChangeBehavior({ ...behavior, realTimeSpeedMultiplier: multiplier })}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    behavior.realTimeSpeedMultiplier === multiplier
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {multiplier}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (onSaveSettings) onSaveSettings();
                setSaveSuccessNotice(true);
                setTimeout(() => setSaveSuccessNotice(false), 3000);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              title="Save all dwell times, article link clicks, ad clicks, scroll behavior and GA4 settings"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessNotice ? 'Saved!' : 'Save Settings'}</span>
            </button>

            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                title="Reset to default behavior parameters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Limits, Dwell & Browsing Depth */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits & Page Views Goal (with Custom Input Mode for Members) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 md:col-span-2 lg:col-span-1 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100">Total Visits / Pageviews Cap</span>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setCustomVisitsMode('custom')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                  customVisitsMode === 'custom'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Member custom numerical input"
              >
                Custom
              </button>
              <button
                type="button"
                onClick={() => setCustomVisitsMode('presets')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                  customVisitsMode === 'presets'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Quick quota presets"
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setCustomVisitsMode('slider')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                  customVisitsMode === 'slider'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Range slider"
              >
                Slider
              </button>
            </div>
          </div>

          {/* Member Status Badge */}
          <div className="flex items-center justify-between text-[10px] px-2 py-1 bg-slate-900/90 rounded-lg border border-slate-800">
            <span className="text-slate-400">Member Quota:</span>
            {currentUser ? (
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentUser.tier.toUpperCase()} ({currentUser.customVisitsLimit ? `${currentUser.customVisitsLimit.toLocaleString()} max` : 'Unlimited'})
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
              >
                Login to unlock higher caps
              </button>
            )}
          </div>

          {/* MODE 1: CUSTOM NUMERICAL INPUT */}
          {customVisitsMode === 'custom' && (
            <div className="space-y-3">
              {/* Custom Visits Input */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <label className="font-semibold flex items-center gap-1">
                    <span>Target Total Visits</span>
                    <span className="text-[10px] text-slate-500 font-normal">(0 = Continuous)</span>
                  </label>
                  <span className="font-mono font-bold text-emerald-400">
                    {behavior.targetTotalVisits ? `${behavior.targetTotalVisits.toLocaleString()} visits` : 'Unlimited (∞)'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Enter custom visits (e.g. 1000, 50000)"
                    value={customVisitsInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomVisitsInput(val);
                      const parsed = parseInt(val, 10);
                      onChangeBehavior({
                        ...behavior,
                        targetTotalVisits: isNaN(parsed) || parsed < 0 ? 0 : parsed,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                  {behavior.targetTotalVisits && behavior.targetTotalVisits > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomVisitsInput('0');
                        onChangeBehavior({ ...behavior, targetTotalVisits: 0 });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer font-sans"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {/* Quick Add Increment Buttons */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-slate-500">Quick:</span>
                  {[100, 500, 1000, 5000, 25000, 100000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const nextVal = (behavior.targetTotalVisits || 0) + inc;
                        setCustomVisitsInput(String(nextVal));
                        onChangeBehavior({ ...behavior, targetTotalVisits: nextVal });
                      }}
                      className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-800 hover:border-slate-700 cursor-pointer font-mono"
                    >
                      +{inc >= 1000 ? `${inc / 1000}k` : inc}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomVisitsInput('0');
                      onChangeBehavior({ ...behavior, targetTotalVisits: 0 });
                    }}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[10px] text-emerald-400 rounded border border-slate-800 cursor-pointer font-mono"
                  >
                    ∞
                  </button>
                </div>
              </div>

              {/* Custom Pageviews Input */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <label className="font-semibold flex items-center gap-1">
                    <span>Target Total Pageviews</span>
                    <span className="text-[10px] text-slate-500 font-normal">(0 = Continuous)</span>
                  </label>
                  <span className="font-mono font-bold text-cyan-400">
                    {behavior.targetTotalPageViews ? `${behavior.targetTotalPageViews.toLocaleString()} views` : 'Unlimited (∞)'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Enter custom pageviews cap (e.g. 5000, 100000)"
                    value={customPageViewsInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomPageViewsInput(val);
                      const parsed = parseInt(val, 10);
                      onChangeBehavior({
                        ...behavior,
                        targetTotalPageViews: isNaN(parsed) || parsed < 0 ? 0 : parsed,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                  {behavior.targetTotalPageViews && behavior.targetTotalPageViews > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPageViewsInput('0');
                        onChangeBehavior({ ...behavior, targetTotalPageViews: 0 });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer font-sans"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: QUICK PRESET TIERS */}
          {customVisitsMode === 'presets' && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Member Visit Cap:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Continuous (∞)', visits: 0, views: 0 },
                  { label: '100 Visits', visits: 100, views: 350 },
                  { label: '500 Visits', visits: 500, views: 1800 },
                  { label: '1,000 Visits', visits: 1000, views: 3500 },
                  { label: '5,000 Visits', visits: 5000, views: 18000 },
                  { label: '10,000 Visits', visits: 10000, views: 35000 },
                  { label: '50,000 Visits', visits: 50000, views: 175000 },
                  { label: '100,000 Visits', visits: 100000, views: 350000 },
                ].map((item) => {
                  const isSelected = behavior.targetTotalVisits === item.visits;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setCustomVisitsInput(String(item.visits));
                        setCustomPageViewsInput(String(item.views));
                        onChangeBehavior({
                          ...behavior,
                          targetTotalVisits: item.visits,
                          targetTotalPageViews: item.views,
                        });
                      }}
                      className={`p-1.5 rounded-lg text-left text-xs font-semibold border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">{item.label}</span>
                        {isSelected && <span className="text-[9px] text-emerald-400">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 3: SLIDER MODE */}
          {customVisitsMode === 'slider' && (
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Target Total Visits:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {behavior.targetTotalVisits ? `${behavior.targetTotalVisits.toLocaleString()} visits` : 'Unlimited'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="50"
                  value={behavior.targetTotalVisits || 0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setCustomVisitsInput(String(v));
                    onChangeBehavior({ ...behavior, targetTotalVisits: v });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Target Pageviews:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {behavior.targetTotalPageViews ? `${behavior.targetTotalPageViews.toLocaleString()} views` : 'Unlimited'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="250"
                  value={behavior.targetTotalPageViews || 0}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setCustomPageViewsInput(String(v));
                    onChangeBehavior({ ...behavior, targetTotalPageViews: v });
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-500">Auto-stops generator upon reaching configured goal (0 = infinite)</p>
        </div>

        {/* Dwell Time per Page (Min & Max Sliders) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Stay Duration (Dwell)</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {behavior.minDwellSeconds}s - {behavior.maxDwellSeconds}s
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Min Dwell: {behavior.minDwellSeconds}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={behavior.minDwellSeconds}
                onChange={(e) => {
                  const minVal = parseInt(e.target.value, 10);
                  onChangeBehavior({
                    ...behavior,
                    minDwellSeconds: minVal,
                    maxDwellSeconds: Math.max(minVal + 5, behavior.maxDwellSeconds),
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Max Dwell: {behavior.maxDwellSeconds}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="240"
                value={behavior.maxDwellSeconds}
                onChange={(e) => {
                  const maxVal = parseInt(e.target.value, 10);
                  onChangeBehavior({
                    ...behavior,
                    maxDwellSeconds: maxVal,
                    minDwellSeconds: Math.min(behavior.minDwellSeconds, maxVal - 5),
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Natural Gaussian reading pauses on each page</p>
        </div>

        {/* Inter-Page Pause Time & Visitor Launch Interval */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Pause Time & Pacing</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {behavior.pauseBetweenPagesSeconds ?? 4}s gap
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Inter-Page Pause: {behavior.pauseBetweenPagesSeconds ?? 4}s</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={behavior.pauseBetweenPagesSeconds ?? 4}
                onChange={(e) => onChangeBehavior({
                  ...behavior,
                  pauseBetweenPagesSeconds: parseInt(e.target.value, 10),
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Inter-Visitor Launch Gap: {behavior.pauseBetweenVisitsSeconds ?? 3}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={behavior.pauseBetweenVisitsSeconds ?? 3}
                onChange={(e) => onChangeBehavior({
                  ...behavior,
                  pauseBetweenVisitsSeconds: parseInt(e.target.value, 10),
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Hesitation pause before internal clicks & launch gap</p>
        </div>

        {/* Multi-Page Navigation Depth */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Pages per Visit</span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {behavior.minPagesPerVisit} - {behavior.maxPagesPerVisit} pages
            </span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Min Pages: {behavior.minPagesPerVisit}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={behavior.minPagesPerVisit}
                onChange={(e) => {
                  const minP = parseInt(e.target.value, 10);
                  onChangeBehavior({
                    ...behavior,
                    minPagesPerVisit: minP,
                    maxPagesPerVisit: Math.max(minP, behavior.maxPagesPerVisit),
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                <span>Max Pages: {behavior.maxPagesPerVisit}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={behavior.maxPagesPerVisit}
                onChange={(e) => {
                  const maxPages = parseInt(e.target.value, 10);
                  onChangeBehavior({
                    ...behavior,
                    maxPagesPerVisit: maxPages,
                    minPagesPerVisit: Math.min(behavior.minPagesPerVisit, maxPages),
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Auto-navigates discovered internal sub-pages</p>
        </div>

        {/* Bounce Rate & Concurrency */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Active Concurrency</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{behavior.activeConcurrentVisitors} Active</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={behavior.activeConcurrentVisitors}
            onChange={(e) => onChangeBehavior({ ...behavior, activeConcurrentVisitors: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-300">Bounce Rate:</span>
              <span className="text-xs font-mono font-bold text-amber-400">{behavior.bounceRatePct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="70"
              value={behavior.bounceRatePct}
              onChange={(e) => onChangeBehavior({ ...behavior, bounceRatePct: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* NEW SECTION: In-Article Post Links & Ads Click Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* In-Article Post Links Clicker */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              <span>In-Article Post Links Clicker (≥ 2 Links)</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={behavior.simulateArticleLinks !== false}
                onChange={(e) => onChangeBehavior({ ...behavior, simulateArticleLinks: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-blue-400">Enabled</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400">
            Automatically finds and clicks at least 2 contextual hyperlinks, table-of-contents anchors, and related post links inside each article.
          </p>

          {behavior.simulateArticleLinks !== false && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Min Article Links:</span>
                    <span className="text-blue-400 font-bold">{behavior.minArticleLinksClicked ?? 2} links</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={behavior.minArticleLinksClicked ?? 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeBehavior({
                        ...behavior,
                        minArticleLinksClicked: val,
                        maxArticleLinksClicked: Math.max(val, behavior.maxArticleLinksClicked ?? 4),
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Max Article Links:</span>
                    <span className="text-blue-400 font-bold">{behavior.maxArticleLinksClicked ?? 4} links</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={behavior.maxArticleLinksClicked ?? 4}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeBehavior({
                        ...behavior,
                        maxArticleLinksClicked: val,
                        minArticleLinksClicked: Math.min(behavior.minArticleLinksClicked ?? 2, val),
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Link Types Toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.articleLinkTypes?.inContentHyperlinks !== false}
                    onChange={(e) => onChangeBehavior({
                      ...behavior,
                      articleLinkTypes: { ...behavior.articleLinkTypes, inContentHyperlinks: e.target.checked }
                    })}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  <span className="text-slate-300 text-[11px]">Contextual Hyperlinks</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.articleLinkTypes?.relatedPostsLinks !== false}
                    onChange={(e) => onChangeBehavior({
                      ...behavior,
                      articleLinkTypes: { ...behavior.articleLinkTypes, relatedPostsLinks: e.target.checked }
                    })}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  <span className="text-slate-300 text-[11px]">Related Posts Cards</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.articleLinkTypes?.tableOfContentsLinks !== false}
                    onChange={(e) => onChangeBehavior({
                      ...behavior,
                      articleLinkTypes: { ...behavior.articleLinkTypes, tableOfContentsLinks: e.target.checked }
                    })}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  <span className="text-slate-300 text-[11px]">Table of Contents</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.articleLinkTypes?.authorCitations !== false}
                    onChange={(e) => onChangeBehavior({
                      ...behavior,
                      articleLinkTypes: { ...behavior.articleLinkTypes, authorCitations: e.target.checked }
                    })}
                    className="w-3.5 h-3.5 rounded accent-blue-500"
                  />
                  <span className="text-slate-300 text-[11px]">Author Citations</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Ads & Monetization Clicks Engine (Banners, Popups, Native) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>Ads & Monetization Clicker (Banners & Popups)</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={behavior.simulateAdClicks !== false}
                onChange={(e) => onChangeBehavior({ ...behavior, simulateAdClicks: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-400">Enabled</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400">
            Interacts with Google AdSense, Mediavine, Taboola, header/sidebar banners, and modal popups.
          </p>

          {behavior.simulateAdClicks !== false && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Ad CTR Rate:</span>
                    <span className="text-amber-400 font-bold">{behavior.adClickThroughRatePct ?? 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={behavior.adClickThroughRatePct ?? 75}
                    onChange={(e) => onChangeBehavior({ ...behavior, adClickThroughRatePct: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Max Ad Clicks/Page:</span>
                    <span className="text-amber-400 font-bold">{behavior.maxAdClicksPerPage ?? 2} ads</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={behavior.maxAdClicksPerPage ?? 2}
                    onChange={(e) => onChangeBehavior({ ...behavior, maxAdClicksPerPage: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Supported Ad Types Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.clickBannerAds !== false}
                    onChange={(e) => onChangeBehavior({ ...behavior, clickBannerAds: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-amber-500"
                  />
                  <span className="text-slate-300 text-[11px]">Header / Sidebar Banners</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.clickPopupAds !== false}
                    onChange={(e) => onChangeBehavior({ ...behavior, clickPopupAds: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-amber-500"
                  />
                  <span className="text-slate-300 text-[11px]">Popup / Interstitial Overlays</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.clickNativeAds !== false}
                    onChange={(e) => onChangeBehavior({ ...behavior, clickNativeAds: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-amber-500"
                  />
                  <span className="text-slate-300 text-[11px]">Native Sponsored Content</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.clickStickyAds !== false}
                    onChange={(e) => onChangeBehavior({ ...behavior, clickStickyAds: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-amber-500"
                  />
                  <span className="text-slate-300 text-[11px]">Sticky Floating Bottom Bar</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REPETITION & NON-REPETITION MODES / CATALOG TRAVERSAL */}
      <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Visitor Repetition, Catalog Traversal & Retention Modes
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure whether page visits and visitors repeat or follow strict non-repetition across all crawled listings/posts.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/20">
            Repetition Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Page Repetition Mode */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              Page Repetition in Session
            </label>
            <select
              value={behavior.pageRepetitionMode || 'strict_unique'}
              onChange={(e) => onChangeBehavior({
                ...behavior,
                pageRepetitionMode: e.target.value as any,
              })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="strict_unique">✨ Strict Unique (No page repetition in session)</option>
              <option value="allow_repeat">🔄 Allow Repetition (Natural return to index/home)</option>
            </select>
            <p className="text-[10px] text-slate-400">
              Strict unique ensures every page clicked during a multi-page visit is a different URL.
            </p>
          </div>

          {/* 2. Full Catalog Traversal */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Traverse All Crawled Listings
              </label>
              <input
                type="checkbox"
                checked={behavior.distinctCatalogTraversal !== false}
                onChange={(e) => onChangeBehavior({
                  ...behavior,
                  distinctCatalogTraversal: e.target.checked,
                })}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              Ensures all crawled job posts, articles, and sub-pages get visited across sessions before recycling the catalog.
            </p>
            <div className="text-[10px] text-indigo-400 font-mono font-semibold">
              {behavior.distinctCatalogTraversal !== false ? '✓ Full Site Catalog Coverage Active' : '○ Random Landing Pool'}
            </div>
          </div>

          {/* 3. Visitor Retention / Identity Mode */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              Visitor Identity / Retention
            </label>
            <select
              value={behavior.visitorRetentionMode || 'unique_only'}
              onChange={(e) => onChangeBehavior({
                ...behavior,
                visitorRetentionMode: e.target.value as any,
              })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="unique_only">👤 100% Unique Visitors (Strict Non-Repetition)</option>
              <option value="mixed_returning">👥 Mixed New & Returning Audience</option>
            </select>
            <p className="text-[10px] text-slate-400">
              {behavior.visitorRetentionMode === 'mixed_returning' 
                ? `Simulates returning visitors (~${100 - (behavior.newVsReturningRatio || 75)}% returning with persistent cookies/GA IDs)` 
                : 'Generates fresh GA Client IDs, browser cookies, and IPs for every visitor session'}
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE-FIRST PERFORMANCE & LIGHTWEIGHT BEACON PAYLOADS */}
      <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mobile-First Execution & Lightweight Beacon Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>Ultra-Low Latency</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prioritizes non-blocking OS sendBeacon delivery, reduces JavaScript CPU loop overhead, and trims beacon query payloads for mobile Safari & Chrome.
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1.5 self-start sm:self-auto ${
            behavior.mobileFirstMode !== false
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${behavior.mobileFirstMode !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{behavior.mobileFirstMode !== false ? 'Mobile-First Active' : 'Standard Mode'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* 1. Mobile-First Mode Toggle */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Mobile-First Priority</span>
              </div>
              <input
                type="checkbox"
                checked={behavior.mobileFirstMode !== false}
                onChange={(e) => onChangeBehavior({ ...behavior, mobileFirstMode: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enables adaptive pacing (1000ms ticker), prioritizing OS-level <code className="text-emerald-300 font-mono text-[10px]">navigator.sendBeacon</code> transmission even when mobile users switch browser tabs.
            </p>
          </div>

          {/* 2. Lightweight Query Payloads */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Lightweight Payloads</span>
              </div>
              <input
                type="checkbox"
                checked={behavior.lightweightPayloads !== false}
                onChange={(e) => onChangeBehavior({ ...behavior, lightweightPayloads: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Trims redundant query string bloat, packing essential GA4 session indicators (<code className="text-cyan-300 font-mono text-[10px]">_ss=1</code>, <code className="text-cyan-300 font-mono text-[10px]">_fv=1</code>, <code className="text-cyan-300 font-mono text-[10px]">_ee=1</code>) for fast packet arrival on 4G/5G mobile connections.
            </p>
          </div>

          {/* 3. Reduce Mobile Thread Usage */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">CPU & Thread Shield</span>
              </div>
              <input
                type="checkbox"
                checked={behavior.reduceMobileThreadUsage !== false}
                onChange={(e) => onChangeBehavior({ ...behavior, reduceMobileThreadUsage: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Throttles high-frequency cursor trajectory calculations and limits in-memory action logs, preventing mobile garbage collection pauses and battery drain.
            </p>
          </div>
        </div>
      </div>

      {/* Human Interaction Toggles, Random Clicks & GA4 Beacon Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Human Interaction & Random Clicks Emulators */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-cyan-400" />
            <span>Human Interaction & Full Page Scrolling</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Scroll all the way to end of page toggle */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Scroll to the End of the Page (100% Depth)</div>
                  <div className="text-[11px] text-slate-400">Scrolls to footer/comments and pauses before next action</div>
                </div>
                <input
                  type="checkbox"
                  checked={behavior.scrollToEndOfPage !== false}
                  onChange={(e) => onChangeBehavior({ ...behavior, scrollToEndOfPage: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              {behavior.scrollToEndOfPage !== false && (
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Footer Dwell Pause:</span>
                    <span className="text-cyan-400 font-bold">{behavior.footerDwellPauseSeconds ?? 5} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={behavior.footerDwellPauseSeconds ?? 5}
                    onChange={(e) => onChangeBehavior({ ...behavior, footerDwellPauseSeconds: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Random Clicks on Page */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Random On-Page Element Clicks</div>
                  <div className="text-[11px] text-slate-400">Clicks buttons, images, cards, and interactive widgets</div>
                </div>
                <input
                  type="checkbox"
                  checked={behavior.simulateRandomClicks !== false}
                  onChange={(e) => onChangeBehavior({ ...behavior, simulateRandomClicks: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              {behavior.simulateRandomClicks !== false && (
                <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Min Clicks/Page:</span>
                      <span className="text-cyan-400 font-bold">{behavior.minClicksPerPage ?? 1}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={behavior.minClicksPerPage ?? 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onChangeBehavior({
                          ...behavior,
                          minClicksPerPage: val,
                          maxClicksPerPage: Math.max(val, behavior.maxClicksPerPage ?? 3),
                        });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Max Clicks/Page:</span>
                      <span className="text-cyan-400 font-bold">{behavior.maxClicksPerPage ?? 3}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={behavior.maxClicksPerPage ?? 3}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onChangeBehavior({
                          ...behavior,
                          maxClicksPerPage: val,
                          minClicksPerPage: Math.min(behavior.minClicksPerPage ?? 1, val),
                        });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">Mouse Movement & Cursor Trajectory</div>
                <div className="text-[11px] text-slate-400">Simulates human cursor pathing and natural micro-hesitations</div>
              </div>
              <input
                type="checkbox"
                checked={behavior.simulateMouseMovement}
                onChange={(e) => onChangeBehavior({ ...behavior, simulateMouseMovement: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Google Analytics GA4 Measurement Protocol Integration */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Google Analytics (GA4) Integration</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ga4.autoSendMeasurementProtocol}
                onChange={(e) => onChangeGa4({ ...ga4, autoSendMeasurementProtocol: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-emerald-400">Dispatch Beacons</span>
            </label>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">
                GA4 Measurement ID (e.g. G-XXXXXXXXXX)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={ga4.measurementId}
                  onChange={(e) => onChangeGa4({ ...ga4, measurementId: e.target.value.trim() })}
                  placeholder="G-XXXXXXXXXX (leave blank for local emulation)"
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestGa4Ping}
                  disabled={testPingStatus === 'testing'}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                  title="Send a sample page_view hit to Google Analytics"
                >
                  <Send className="w-3 h-3" />
                  <span>{testPingStatus === 'testing' ? 'Pinging...' : 'Test Page View'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestGa4ClickPing}
                  disabled={testClickPingStatus === 'testing'}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-md shadow-indigo-950"
                  title="Send a sample click event with link URL and outbound parameters to Google Analytics"
                >
                  <Send className="w-3 h-3" />
                  <span>{testClickPingStatus === 'testing' ? 'Clicking...' : 'Test Click Beacon'}</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase">
                  Measurement Protocol API Secret (Optional)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">GA4 Admin → Data Streams → API secrets</span>
              </div>
              <input
                type="password"
                value={ga4.apiSecret || ''}
                onChange={(e) => onChangeGa4({ ...ga4, apiSecret: e.target.value.trim() })}
                placeholder="Optional API Secret (for 100% verified server-side Measurement Protocol)"
                className="w-full mt-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>

            {testPingStatus === 'success' && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Test GA4 page_view beacon successfully dispatched to Google Analytics servers!</span>
              </div>
            )}

            {testClickPingStatus === 'success' && (
              <div className="text-xs text-cyan-400 flex items-center gap-1.5 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Test GA4 click beacon successfully recorded! Check GA4 Realtime → "Event count by Event name" (click) or Admin → DebugView.</span>
              </div>
            )}

            {testClickPingStatus === 'failed' && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Click beacon test encountered an error. Check Measurement ID format (G-XXXXXXXXXX).</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-300 font-semibold block">💡 How Google Analytics Records Simulated Clicks:</span>
              <p>
                All simulated article link clicks, ad clicks, and navigation link clicks dispatch standard GA4 <code className="text-cyan-300">click</code> events with authentic parameters (<code className="text-cyan-300">link_url</code>, <code className="text-cyan-300">link_text</code>, <code className="text-cyan-300">link_domain</code>, <code className="text-cyan-300">outbound: true</code>, and <code className="text-cyan-300">_dbg: 1</code>).
              </p>
              <p className="text-slate-500">
                To view them live: Open <strong className="text-slate-400">Google Analytics → Admin → DebugView</strong> (shows every click immediately) or <strong className="text-slate-400">Reports → Realtime → Event count by Event name</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
