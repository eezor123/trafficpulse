import React, { useState } from 'react';
import { 
  Globe, 
  RefreshCw, 
  Play, 
  Square, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ExternalLink,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { SiteCrawlState, TestStatus } from '../types';

interface TargetUrlCommandBarProps {
  targetUrl: string;
  onUpdateTargetUrl: (url: string) => void;
  crawlState: SiteCrawlState;
  onStartCrawl: (urlOverride?: string) => void;
  status: TestStatus;
  onStartTraffic: () => void;
  onStopTraffic: () => void;
  activeVisitorsCount: number;
}

const PRESET_URLS = [
  { name: '9jaJobs Portal (SPA - 16+ Jobs)', url: 'https://9jajobs.vercel.app' },
  { name: 'Eezor Jobs (Escrow)', url: 'https://jobs.eezor.com' },
  { name: 'Eezor Store', url: 'https://eezor.com' },
  { name: 'Techpoint Africa', url: 'https://techpoint.africa' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
];

export const TargetUrlCommandBar: React.FC<TargetUrlCommandBarProps> = ({
  targetUrl,
  onUpdateTargetUrl,
  crawlState,
  onStartCrawl,
  status,
  onStartTraffic,
  onStopTraffic,
  activeVisitorsCount,
}) => {
  const [inputUrl, setInputUrl] = useState(targetUrl);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [showPingModal, setShowPingModal] = useState(false);

  // Sync inputUrl when targetUrl changes from external sources
  React.useEffect(() => {
    setInputUrl(targetUrl);
  }, [targetUrl]);

  const handleCrawlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const formatted = inputUrl.trim().startsWith('http://') || inputUrl.trim().startsWith('https://') || inputUrl.trim().startsWith('/')
      ? inputUrl.trim()
      : `https://${inputUrl.trim()}`;
    onUpdateTargetUrl(formatted);
    onStartCrawl(formatted);
  };

  const handleApplyPreset = (url: string) => {
    setInputUrl(url);
    onUpdateTargetUrl(url);
    onStartCrawl(url);
  };

  const handleTestPing = async () => {
    if (!inputUrl.trim()) return;
    const formatted = inputUrl.trim().startsWith('http') || inputUrl.trim().startsWith('/')
      ? inputUrl.trim()
      : `https://${inputUrl.trim()}`;
    
    setIsPinging(true);
    setShowPingModal(true);
    setPingResult(null);

    try {
      const res = await fetch('/api/traffic/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formatted, targetUrl: formatted }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, reachable: false, error: `Invalid response (${res.status} ${res.statusText})` };
      }
      setPingResult(data);
    } catch (err: any) {
      setPingResult({
        success: false,
        reachable: false,
        error: err.message || 'Ping dispatch failed',
      });
    } finally {
      setIsPinging(false);
    }
  };

  const includedPagesCount = crawlState.pages.filter(p => p.includedInVisits).length;
  const isRunning = status === 'running';

  return (
    <div className="bg-slate-900 border-2 border-cyan-500/40 shadow-2xl rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top Banner with Main Input */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Label */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Target Website & Real-Time Traffic Dispatch
              </h2>
              {isRunning && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/90 border border-emerald-500/50 text-emerald-300">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>DISPATCHING LIVE</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Input any public URL to autonomously crawl internal pages and dispatch real multi-country organic visits.
            </p>
          </div>
        </div>

        {/* Right Input and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-3xl">
          <form onSubmit={handleCrawlSubmit} className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://yourwebsite.com or news.ycombinator.com"
              className="w-full bg-slate-950 border-2 border-slate-700/90 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono shadow-inner"
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => { setInputUrl(''); onUpdateTargetUrl(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Crawl Button */}
          <button
            type="button"
            onClick={handleCrawlSubmit}
            disabled={crawlState.isCrawling || !inputUrl.trim()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            title="Scan website and discover internal pages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
            <span>{crawlState.isCrawling ? 'Crawling...' : 'Crawl Site'}</span>
          </button>

          {/* Ping Test Button */}
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isPinging || !inputUrl.trim()}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
            title="Test direct server ping and view HTTP response headers"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPinging ? 'animate-bounce' : ''}`} />
            <span>Ping</span>
          </button>

          {/* Master Start / Stop Button */}
          {!isRunning ? (
            <button
              type="button"
              onClick={onStartTraffic}
              disabled={!inputUrl.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Real Traffic</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopTraffic}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40 transition-all shrink-0 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Traffic</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Status Info Bar & Quick Preset Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Left Status Bar */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-medium">Active Target:</span>
          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            {crawlState.hostname || 'Target URL Ready'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">
            <span className="text-emerald-400 font-bold font-mono">{crawlState.pages.length}</span> Pages Discovered
            <span className="text-slate-500 ml-1">({includedPagesCount} active in rotation)</span>
          </span>
          {crawlState.gaMeasurementId && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{crawlState.gaMeasurementId}</span>
              </span>
            </>
          )}
        </div>

        {/* Right Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">Quick Test:</span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset.url)}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-md text-[10px] font-mono cursor-pointer transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ping & Server Header Modal */}
      {showPingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Target Server Connectivity & Headers</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPingModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isPinging ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300">Sending real HTTP probe to {inputUrl}...</p>
              </div>
            ) : pingResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  pingResult.reachable 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {pingResult.reachable ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold">
                        {pingResult.reachable ? `HTTP ${pingResult.statusCode} ${pingResult.statusText}` : 'Server Unreachable / Timeout'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Latency: {pingResult.latencyMs}ms | Server: {pingResult.server || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  {pingResult.reachable && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-900/60 text-emerald-200">
                      200 OK
                    </span>
                  )}
                </div>

                {/* Server Headers Table */}
                {pingResult.headers && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-300 uppercase">Response Headers:</div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-40 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1">
                      {Object.entries(pingResult.headers).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-cyan-400 font-semibold">{k}:</span>
                          <span className="text-slate-300 truncate">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPingModal(false);
                      onStartCrawl();
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Crawl this Site Now
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
