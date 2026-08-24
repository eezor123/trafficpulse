import React, { useState } from 'react';
import { 
  Users, 
  Globe, 
  Clock, 
  Search, 
  Share2, 
  MousePointer, 
  ArrowRight, 
  Layers, 
  Activity, 
  Compass, 
  Eye, 
  Sparkles, 
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Zap,
  Server,
  FileCode,
  Radio,
  Link2,
  Megaphone,
  Check,
  RotateCcw,
  X,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ActiveVisitorSession, LiveTelemetryEvent, RealHttpTrafficHit } from '../types';

interface LiveVisitorStreamProps {
  status: 'idle' | 'running' | 'paused' | 'completed';
  activeVisitors: ActiveVisitorSession[];
  telemetryEvents: LiveTelemetryEvent[];
  httpHits?: RealHttpTrafficHit[];
  stats: {
    totalVisitorsDispatched: number;
    totalPageViews: number;
    bouncedSessions: number;
    avgEngagementSec: number;
    activeCount: number;
    sourcesCount: { organic: number; social: number; direct: number; referral: number };
    countryCount: Record<string, number>;
    totalArticleLinksClicked?: number;
    totalAdClicks?: number;
    totalPopupInteractions?: number;
    fullScrollRatePct?: number;
  };
  targetUrl: string;
  onClearEvents?: () => void;
}

const SOURCE_COLORS = {
  organic: '#10b981', // emerald
  social: '#06b6d4',  // cyan
  direct: '#a855f7',  // purple
  referral: '#f59e0b', // amber
};

export const LiveVisitorStream: React.FC<LiveVisitorStreamProps> = ({
  status,
  activeVisitors,
  telemetryEvents,
  httpHits = [],
  stats,
  targetUrl,
  onClearEvents,
}) => {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stream' | 'http_hits' | 'browser' | 'ga4'>('stream');
  const [selectedHit, setSelectedHit] = useState<RealHttpTrafficHit | null>(null);

  const selectedVisitor = activeVisitors.find(v => v.visitorId === selectedVisitorId) || activeVisitors[0];

  const pieData = [
    { name: 'Organic Search', value: stats.sourcesCount.organic, color: SOURCE_COLORS.organic },
    { name: 'Social Media', value: stats.sourcesCount.social, color: SOURCE_COLORS.social },
    { name: 'Direct Traffic', value: stats.sourcesCount.direct, color: SOURCE_COLORS.direct },
    { name: 'Referrals', value: stats.sourcesCount.referral, color: SOURCE_COLORS.referral },
  ].filter(d => d.value > 0);

  const bounceRatePct = stats.totalVisitorsDispatched > 0 
    ? ((stats.bouncedSessions / stats.totalVisitorsDispatched) * 100).toFixed(1) 
    : '0.0';

  const pagesPerSession = stats.totalVisitorsDispatched > 0
    ? (stats.totalPageViews / stats.totalVisitorsDispatched).toFixed(1)
    : '1.0';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header & Stat Counters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            {status === 'running' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Live Autonomous Visitor Stream & Real Traffic Hub</h2>
              {status === 'running' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>DISPATCHING LIVE</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Watching simulated human visitors explore pages, stay, scroll, and send real HTTP requests to target servers.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stream' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Live Visitors</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
              {activeVisitors.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('http_hits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'http_hits' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Real HTTP Hits</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-300 font-mono">
              {httpHits.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'browser' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Virtual Browser</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ga4')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ga4' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GA4 Metrics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">Active Visitors</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{stats.activeCount}</span>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">Total Visits</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
            {stats.totalVisitorsDispatched}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">Page Views</span>
          <div className="text-lg font-bold font-mono text-indigo-300 mt-0.5">
            {stats.totalPageViews}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">Avg Dwell</span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
            {stats.avgEngagementSec}s
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block truncate flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            <span>Article Links</span>
          </span>
          <div className="text-lg font-bold font-mono text-blue-300 mt-0.5">
            {stats.totalArticleLinksClicked ?? 0}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block truncate flex items-center gap-1">
            <Megaphone className="w-3 h-3" />
            <span>Ad Clicks</span>
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
            {stats.totalAdClicks ?? 0}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block truncate">Popups Handled</span>
          <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
            {stats.totalPopupInteractions ?? 0}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-teal-400 uppercase font-bold tracking-wider block truncate">Footer Reached</span>
          <div className="text-lg font-bold font-mono text-teal-300 mt-0.5">
            {stats.fullScrollRatePct ?? 0}%
          </div>
        </div>
      </div>

      {/* Tab 1: Live Visitors Cards Stream */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {activeVisitors.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Engine Waiting to Start</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <span className="text-cyan-400 font-semibold font-mono">"Start Traffic"</span> in the navbar above to launch autonomous organic and social visitors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeVisitors.map((visitor) => {
                const currentPage = visitor.visitedPages[visitor.currentPageIndex];
                const pageProgress = currentPage 
                  ? Math.min(100, Math.round((currentPage.dwellSecondsSpent / Math.max(1, currentPage.dwellPlannedSeconds)) * 100))
                  : 0;

                return (
                  <div
                    key={visitor.visitorId}
                    onClick={() => {
                      setSelectedVisitorId(visitor.visitorId);
                      setActiveTab('browser');
                    }}
                    className="bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 space-y-3.5 cursor-pointer transition-all shadow-lg group relative overflow-hidden"
                  >
                    {/* Top Visitor Identity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{visitor.country.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span>Visitor #{visitor.visitorNumber}</span>
                            <span className="text-[10px] text-cyan-300 font-mono font-normal">({visitor.country.name})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                            {visitor.ipAddress || visitor.country.ipSample} • {visitor.deviceType}
                          </div>
                        </div>
                      </div>

                      {/* Traffic Source Pill */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                        visitor.trafficSource === 'Organic Search' 
                          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                          : visitor.trafficSource === 'Social'
                          ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                          : visitor.trafficSource === 'Direct'
                          ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                          : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                      }`}>
                        {visitor.trafficSource}
                      </span>
                    </div>

                    {/* Referrer / Search Keyword Query */}
                    <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] space-y-1 border border-slate-800/80">
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        {visitor.trafficSource === 'Organic Search' ? (
                          <Search className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3 h-3 text-cyan-400" />
                        )}
                        <span className="truncate text-slate-300 font-mono">{visitor.referrerName}</span>
                      </div>
                    </div>

                    {/* Active Page Dwell & Navigation Path */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[11px] truncate max-w-[170px]">
                          {currentPage?.path || '/'}
                        </span>
                        <div className="flex items-center gap-2">
                          {currentPage && (currentPage.plannedClicks || 0) > 0 && (
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                              <MousePointer className="w-2.5 h-2.5" />
                              <span>{currentPage.clicksPerformed || 0}/{currentPage.plannedClicks}</span>
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-400">
                            {Math.round(currentPage?.dwellSecondsSpent || 0)}s / {currentPage?.dwellPlannedSeconds}s
                          </span>
                        </div>
                      </div>

                      {/* Dwell Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${pageProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Human Behavior Action Badges: Article Links, Ads & End Scroll */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      {/* In-Article Links Clicked Badge */}
                      <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        (currentPage?.articleLinksClicked || 0) > 0
                          ? 'bg-blue-950/80 border-blue-500/40 text-blue-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Link2 className="w-2.5 h-2.5" />
                        <span>Links: {currentPage?.articleLinksClicked || 0}/{currentPage?.articleLinksPlanned ?? 2}</span>
                      </span>

                      {/* Ads Clicked Badge */}
                      <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        (currentPage?.adClicksPerformed || 0) > 0
                          ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Megaphone className="w-2.5 h-2.5" />
                        <span>Ads: {currentPage?.adClicksPerformed || 0}/{currentPage?.adClicksPlanned ?? 1}</span>
                      </span>

                      {/* End of Page / Footer Scroll Badge */}
                      {currentPage?.hasScrolledToEnd && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-950/80 border border-teal-500/40 text-teal-300 font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>100% Footer</span>
                        </span>
                      )}
                    </div>

                    {/* Footer: Human Micro-Actions & Step Path */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <div className="flex items-center gap-1.5 truncate">
                        <MousePointer className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate text-[10px] text-slate-300">
                          {visitor.lastEventLog}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        Page {visitor.currentPageIndex + 1}/{visitor.totalPlannedPages}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Real-time Telemetry Event Feed */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live Event Telemetry Log ({telemetryEvents.length} Events)</span>
              </div>
              {onClearEvents && (
                <button
                  type="button"
                  onClick={onClearEvents}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Clear Feed
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs pr-1">
              {telemetryEvents.length === 0 ? (
                <div className="text-slate-600 text-center py-4">No events logged yet.</div>
              ) : (
                telemetryEvents.slice(0, 30).map((evt) => (
                  <div 
                    key={evt.id} 
                    className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-900/60 hover:bg-slate-900 text-[11px] border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{evt.countryFlag}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                        evt.eventType === 'ad_click'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                          : evt.eventType === 'article_link_click'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                          : evt.eventType === 'popup_interaction'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          : evt.eventType === 'footer_scroll'
                          ? 'bg-teal-950 text-teal-300 border border-teal-500/30'
                          : 'bg-slate-800 text-cyan-300'
                      }`}>
                        {evt.eventType}
                      </span>
                      <span className="text-slate-300 truncate">{evt.details}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0 ml-2">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Real HTTP Request Dispatch Feed */}
      {activeTab === 'http_hits' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Live Target Server HTTP Traffic Hits ({httpHits.length} Requests)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real HTTP GET requests transmitted to <span className="text-cyan-300 font-mono">{targetUrl}</span> by active organic visitors.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">Avg Response Time</span>
                <span className="text-amber-300 font-bold">
                  {httpHits.length > 0
                    ? Math.round(httpHits.reduce((acc, h) => acc + h.latencyMs, 0) / httpHits.length)
                    : 0}ms
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">Total Data Transferred</span>
                <span className="text-cyan-300 font-bold">
                  {(httpHits.reduce((acc, h) => acc + h.bytes, 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* HTTP Hits Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10 font-mono">
                  <tr>
                    <th className="py-2.5 px-3 w-24">Status</th>
                    <th className="py-2.5 px-3 w-16">Method</th>
                    <th className="py-2.5 px-3">Path & Target URL</th>
                    <th className="py-2.5 px-3 w-28">Latency / Size</th>
                    <th className="py-2.5 px-3 w-40">Visitor / Country</th>
                    <th className="py-2.5 px-3 w-44">Referrer</th>
                    <th className="py-2.5 px-3 w-16 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                  {httpHits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        No HTTP requests dispatched yet. Click "Launch Real Traffic" to start sending live visitor hits.
                      </td>
                    </tr>
                  ) : (
                    httpHits.slice(0, 100).map((hit) => {
                      const is2xx = hit.statusCode >= 200 && hit.statusCode < 300;
                      const is3xx = hit.statusCode >= 300 && hit.statusCode < 400;

                      return (
                        <tr key={hit.id} className="hover:bg-slate-900/60 transition-colors font-mono text-[11px]">
                          {/* Status */}
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              is2xx
                                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                                : is3xx
                                ? 'bg-amber-950/80 border border-amber-500/40 text-amber-400'
                                : 'bg-rose-950/80 border border-rose-500/40 text-rose-400'
                            }`}>
                              {hit.statusCode > 0 ? `${hit.statusCode} ${hit.statusText}` : 'NET ERR'}
                            </span>
                          </td>

                          {/* Method */}
                          <td className="py-2 px-3 font-bold text-cyan-400">
                            {hit.method}
                          </td>

                          {/* Path */}
                          <td className="py-2 px-3 font-medium">
                            <span className="text-slate-200">{hit.path}</span>
                          </td>

                          {/* Latency & Bytes */}
                          <td className="py-2 px-3 text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-300 font-semibold">{hit.latencyMs}ms</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{(hit.bytes / 1024).toFixed(1)} KB</span>
                            </div>
                          </td>

                          {/* Visitor & Country */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5 text-slate-300 font-sans">
                              <span>{hit.countryFlag}</span>
                              <span className="truncate max-w-[110px]">Vis #{hit.visitorNumber} ({hit.country})</span>
                            </div>
                          </td>

                          {/* Referrer */}
                          <td className="py-2 px-3 text-slate-400 truncate max-w-[160px]" title={hit.referrer}>
                            {hit.referrer.replace('https://', '').replace('http://', '') || 'Direct'}
                          </td>

                          {/* Inspect Action */}
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedHit(hit)}
                              className="text-cyan-400 hover:text-cyan-300 cursor-pointer hover:underline text-[10px]"
                            >
                              Headers
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Header Inspector Modal */}
      {selectedHit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">HTTP Request & Server Response Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHit(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div><span className="text-slate-500">Target URL:</span> <span className="text-cyan-300">{selectedHit.url}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold">{selectedHit.statusCode} {selectedHit.statusText}</span></div>
                <div><span className="text-slate-500">Latency:</span> <span className="text-amber-300">{selectedHit.latencyMs}ms</span></div>
                <div><span className="text-slate-500">Payload Size:</span> <span className="text-slate-300">{(selectedHit.bytes / 1024).toFixed(2)} KB ({selectedHit.bytes} bytes)</span></div>
                <div><span className="text-slate-500">Referrer:</span> <span className="text-slate-300">{selectedHit.referrer}</span></div>
                <div><span className="text-slate-500">User-Agent:</span> <span className="text-slate-400 truncate block">{selectedHit.userAgent}</span></div>
              </div>

              {selectedHit.headers && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-300 uppercase">Response Headers:</div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-h-36 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1">
                    {Object.entries(selectedHit.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-cyan-400 font-semibold">{k}:</span>
                        <span className="text-slate-300 truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Virtual Browser Viewport Stage */}
      {activeTab === 'browser' && selectedVisitor && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser Top Window Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
              {/* Window Dots & Navigation Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                {/* Reload / Refresh Button */}
                <div className={`p-1 rounded-md text-slate-400 ${selectedVisitor.status === 'reloading_page' ? 'text-amber-400 bg-amber-950/60 animate-spin' : ''}`}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* URL Address Bar */}
              <div className="flex-1 max-w-2xl bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate">
                    {targetUrl}{selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.path || ''}
                  </span>
                </div>
                {selectedVisitor.status === 'reloading_page' && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse whitespace-nowrap">
                    RELOADING (F5)
                  </span>
                )}
              </div>

              {/* Visitor Country, Device & Sticky Session Badge */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span>{selectedVisitor.country.flag}</span>
                <span className="hidden sm:inline text-slate-300 font-bold">{selectedVisitor.country.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Visitor #{selectedVisitor.visitorNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 hidden md:inline">
                  {selectedVisitor.proxyUsed ? 'Sticky Proxy' : 'Direct IP'}
                </span>
              </div>
            </div>

            {/* Simulated Viewport Stage */}
            <div className="relative min-h-[500px] bg-slate-900/40 p-6 flex flex-col justify-between overflow-hidden">
              {/* Simulated Mouse Cursor */}
              <div
                className="absolute w-5 h-5 pointer-events-none transition-all duration-300 z-50"
                style={{
                  left: `${selectedVisitor.cursorX}%`,
                  top: `${selectedVisitor.cursorY}%`,
                }}
              >
                <MousePointer className="w-5 h-5 text-cyan-400 fill-cyan-400/40 drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]" />
                {(selectedVisitor.status === 'clicking_ad' || selectedVisitor.status === 'clicking_link' || selectedVisitor.status === 'handling_popup') && (
                  <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Scroll Depth Tracker & Realtime Status Watermark */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap justify-end">
                <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg">
                  <span className="text-slate-400">Scroll Depth:</span>
                  <span className="text-cyan-400 font-bold">{selectedVisitor.currentScrollDepthPct}%</span>
                </div>
                {selectedVisitor.status === 'clicking_ad' && (
                  <span className="bg-amber-950 border border-amber-500/50 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-bold font-mono animate-bounce flex items-center gap-1.5 shadow-lg shadow-amber-950/50">
                    <Megaphone className="w-4 h-4 animate-pulse" />
                    <span>CLICKING BANNER AD</span>
                  </span>
                )}
                {selectedVisitor.status === 'clicking_link' && (
                  <span className="bg-blue-950 border border-blue-500/50 text-blue-300 text-xs px-3 py-1.5 rounded-xl font-bold font-mono animate-bounce flex items-center gap-1.5 shadow-lg shadow-blue-950/50">
                    <Link2 className="w-4 h-4 animate-pulse" />
                    <span>CLICKING IN-POST LINK</span>
                  </span>
                )}
                {selectedVisitor.status === 'handling_popup' && (
                  <span className="bg-purple-950 border border-purple-500/50 text-purple-300 text-xs px-3 py-1.5 rounded-xl font-bold font-mono animate-bounce flex items-center gap-1.5 shadow-lg shadow-purple-950/50">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>HANDLING POPUP AD</span>
                  </span>
                )}
                {selectedVisitor.status === 'reloading_page' && (
                  <span className="bg-amber-950 border border-amber-500/50 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-bold font-mono animate-pulse flex items-center gap-1.5 shadow-lg">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>PAGE RELOAD (F5)</span>
                  </span>
                )}
              </div>

              {/* Simulated Rendered Web Page Content */}
              <div className="max-w-2xl mx-auto w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 my-auto shadow-2xl relative">
                
                {/* INTERSTITIAL / NEWSLETTER POPUP MODAL OVERLAY */}
                {selectedVisitor.status === 'handling_popup' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-40 rounded-2xl flex items-center justify-center p-6 transition-all duration-300">
                    <div className="bg-slate-900 border-2 border-purple-500/60 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 relative animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                          <Sparkles className="w-4 h-4" />
                          <span>INTERSTITIAL PROMO POPUP</span>
                        </div>
                        <button type="button" className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        Exclusive Industry Whitepaper & Free Access
                      </h4>
                      <p className="text-xs text-slate-300">
                        Join 45,000+ engineers receiving our weekly breakdown on high-performance web infrastructure.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button type="button" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/40">
                          <span>Claim Instant Access</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button type="button" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl border border-slate-700">
                          Dismiss
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 text-center flex items-center justify-center gap-1">
                        <span>Ad Network: Google AdSense Interstitial</span>
                        <span>•</span>
                        <span className="text-purple-400 font-bold">Simulated Human Click</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header Banner Ad Slot */}
                <div className={`w-full rounded-xl p-3 flex items-center justify-between text-xs transition-all duration-300 ${
                  selectedVisitor.status === 'clicking_ad'
                    ? 'bg-amber-950/60 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50'
                    : 'bg-slate-900/80 border border-dashed border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                    <Megaphone className={`w-4 h-4 ${selectedVisitor.status === 'clicking_ad' ? 'animate-bounce text-amber-300' : ''}`} />
                    <div>
                      <span className="font-bold block">LEADERBOARD DISPLAY BANNER (728x90)</span>
                      <span className="text-[10px] text-slate-400">Google AdSense • CPM Responsive Banner</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedVisitor.status === 'clicking_ad' && (
                      <span className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] font-mono animate-pulse">
                        AD CLICKED!
                      </span>
                    )}
                    <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-1 rounded border border-amber-500/40 font-mono">
                      Sponsored
                    </span>
                  </div>
                </div>

                {/* Article Header & Title */}
                <div className="border-b border-slate-800 pb-3">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold mb-1">
                    Article & Content Post
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.title || 'Exploring Article Content'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1.5">
                    <span>Path: {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.path || '/'}</span>
                    <span>•</span>
                    <span className="text-cyan-300">
                      Dwell: {Math.round(selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.dwellSecondsSpent || 0)}s / {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.dwellPlannedSeconds}s
                    </span>
                  </div>
                </div>

                {/* In-Article Body Simulation with Contextual Hyperlinks */}
                <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  <p>
                    Autonomous organic traffic simulation incorporates complete human browsing flows. Visitors read narrative sections and explore{' '}
                    <span className={`underline font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1 transition-all duration-300 ${
                      selectedVisitor.status === 'clicking_link'
                        ? 'bg-blue-500 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.6)] border border-blue-300'
                        : 'text-blue-400 bg-blue-950/40 border border-blue-500/30'
                    }`}>
                      <Link2 className="w-2.5 h-2.5" />
                      <span>System Architecture Overview</span>
                    </span>{' '}
                    to inspect technical subpages.
                  </p>
                  <p>
                    While scrolling towards the conclusion, visitors interact with related guides such as{' '}
                    <span className="text-blue-400 underline font-semibold bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/30 inline-flex items-center gap-1">
                      <Link2 className="w-2.5 h-2.5" />
                      <span>High-Performance Scaling 2026</span>
                    </span>{' '}
                    and generate realistic engagement dwell times.
                  </p>
                </div>

                {/* In-Article Native Sponsor Card */}
                <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Sponsored Recommendation</span>
                    <p className="text-xs text-slate-200 font-semibold">Accelerate Your Cloud Deployments in Under 60 Seconds</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-mono shrink-0">
                    Visit Sponsor ➔
                  </span>
                </div>

                {/* Interactive Engagement Status Counters */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-500 block">Article Links Clicked</span>
                    <span className="text-blue-400 font-bold">
                      {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.articleLinksClicked || 0} / {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.articleLinksPlanned ?? 2}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-500 block">Ads Clicked</span>
                    <span className="text-amber-400 font-bold">
                      {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.adClicksPerformed || 0} / {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.adClicksPlanned ?? 1}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-500 block">End-of-Page Scroll</span>
                    <span className={selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.hasScrolledToEnd ? 'text-teal-400 font-bold' : 'text-slate-400'}>
                      {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.hasScrolledToEnd ? '100% (Footer)' : `${selectedVisitor.currentScrollDepthPct}%`}
                    </span>
                  </div>
                </div>

                {/* Footer Section with Fingerprints & Status */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedVisitor.lastEventLog}</span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    GA4 ID: {selectedVisitor.gaClientId.slice(0, 12)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Google Analytics GA4 Real-Time View */}
      {activeTab === 'ga4' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Traffic Acquisition Donut Chart */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Traffic Acquisition Channels (GA4)
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Organic: {stats.sourcesCount.organic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-300">Social: {stats.sourcesCount.social}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-300">Direct: {stats.sourcesCount.direct}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Referral: {stats.sourcesCount.referral}</span>
                </div>
              </div>
            </div>

            {/* Country Distribution Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 lg:col-span-2">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Geographic Country Distribution
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Country</th>
                      <th className="py-2 px-3 text-right">Sessions</th>
                      <th className="py-2 px-3 text-right">Share %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.entries(stats.countryCount).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500">No country sessions logged yet</td>
                      </tr>
                    ) : (
                      Object.entries(stats.countryCount).map(([code, count]) => {
                        const numCount = Number(count);
                        const pct = stats.totalVisitorsDispatched > 0 
                          ? ((numCount / stats.totalVisitorsDispatched) * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <tr key={code} className="hover:bg-slate-900/60">
                            <td className="py-2 px-3 text-slate-200 font-sans font-medium">{code}</td>
                            <td className="py-2 px-3 text-right text-cyan-400">{numCount}</td>
                            <td className="py-2 px-3 text-right text-slate-300">{pct}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
