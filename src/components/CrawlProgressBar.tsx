import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  Zap,
  Radio
} from 'lucide-react';

interface CrawlProgressBarProps {
  isCrawling: boolean;
  progressPct?: number;
  phase?: string;
  currentScanningUrl?: string;
  discoveredCount: number;
  postsCount: number;
  categoriesCount: number;
  pagesCount: number;
  visitedUrlsCount?: number;
  targetUrl: string;
  statusCode?: number;
  latencyMs?: number;
}

export const CrawlProgressBar: React.FC<CrawlProgressBarProps> = ({
  isCrawling,
  progressPct = 0,
  phase,
  currentScanningUrl,
  discoveredCount,
  postsCount,
  categoriesCount,
  pagesCount,
  visitedUrlsCount,
  targetUrl,
  statusCode,
  latencyMs,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPct)));
  
  // Dynamic status text fallback based on progress
  const displayPhase = phase || (
    isCrawling
      ? clampedProgress < 20 
        ? 'Initiating Handshake & Resolving DNS...' 
        : clampedProgress < 45 
        ? 'Scraping Root HTML & Meta Headers...' 
        : clampedProgress < 70 
        ? 'Decompiling JavaScript Bundles & JSON-LD...' 
        : clampedProgress < 90 
        ? 'Executing Recursive DOM Link-Discovery Pass...' 
        : 'Deduplicating Routes & Calculating Priority Weights...'
      : discoveredCount > 0 
        ? 'Crawl Completed • All Routes Synced' 
        : 'Crawler Idle • Ready to Discover Routes'
  );

  return (
    <div 
      id="crawl-progress-bar-container"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isCrawling 
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border-cyan-500/50 shadow-cyan-950/30' 
          : 'bg-slate-900/90 border-slate-800'
      } p-4 sm:p-5`}
    >
      {/* Top Header: Phase, Live Indicator, Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
            isCrawling 
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-900/40 animate-pulse' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}>
            {isCrawling ? (
              <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : discoveredCount > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Activity className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Autonomous Crawl Engine</span>
              </span>
              {isCrawling && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>ACTIVE SCAN</span>
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{displayPhase}</span>
            </h4>
          </div>
        </div>

        {/* Progress Percentage Badge & Real-Time Discovery Metric */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className={`text-xl sm:text-2xl font-black ${
                isCrawling ? 'text-cyan-300' : 'text-slate-200'
              }`}>
                {isCrawling ? `${clampedProgress}%` : discoveredCount > 0 ? '100%' : '0%'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {isCrawling ? 'Live Scan Progress' : 'Graph Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5 my-3 shadow-inner">
        <div
          id="crawl-progress-bar-fill"
          className={`h-full rounded-full transition-all duration-300 ease-out relative ${
            isCrawling
              ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 shadow-lg shadow-cyan-500/50'
              : discoveredCount > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-slate-700'
          }`}
          style={{ width: `${isCrawling ? Math.max(8, clampedProgress) : discoveredCount > 0 ? 100 : 0}%` }}
        >
          {isCrawling && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>

      {/* Live Active URL Being Scanned (Visible during crawl or shows last target) */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 font-mono">
            {isCrawling ? 'SCANNING ROUTE:' : 'TARGET URL:'}
          </span>
          <span 
            className="font-mono text-cyan-300 truncate text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20"
            title={currentScanningUrl || targetUrl}
          >
            {currentScanningUrl || targetUrl || 'No target configured'}
          </span>
          {isCrawling && (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
          )}
        </div>

        {/* Real-time Discovery Counters */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono shrink-0">
          <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{postsCount} Listings</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>{categoriesCount} Cats</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold">
            {pagesCount} Pages
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Total: {discoveredCount}
          </span>
        </div>
      </div>
    </div>
  );
};
