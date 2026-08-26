import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  Briefcase,
  MapPin,
  DollarSign,
  Bookmark,
  Send,
  MessageSquare,
  MessageCircle,
  Award,
  Lock,
  Flame,
  Maximize2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ActiveVisitorSession, LiveTelemetryEvent, RealHttpTrafficHit } from '../types';
import { ALL_VERIFIED_NAIJA_JOBS, VERIFIED_NAIJA_ARTICLES } from '../data/allNaijaJobListings';

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
  const [autoFollow, setAutoFollow] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [viewportMode, setViewportMode] = useState<'dom' | 'iframe'>('dom');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-follow active visitor if enabled
  useEffect(() => {
    if (autoFollow && activeVisitors.length > 0) {
      const activeInteracting = activeVisitors.find(
        v => v.status === 'clicking_link' || v.status === 'clicking_ad' || v.status === 'handling_popup'
      ) || activeVisitors[0];
      if (activeInteracting && activeInteracting.visitorId !== selectedVisitorId) {
        setSelectedVisitorId(activeInteracting.visitorId);
      }
    }
  }, [activeVisitors, autoFollow, selectedVisitorId]);

  const selectedVisitor = activeVisitors.find(v => v.visitorId === selectedVisitorId) || activeVisitors[0];

  // Helper to compute full absolute URL
  const computeFullUrl = (path: string = '/'): string => {
    const rawTarget = targetUrl && targetUrl.trim() ? targetUrl.trim() : 'https://9jajobs.vercel.app';
    const base = rawTarget.startsWith('http') ? rawTarget.replace(/\/$/, '') : `https://${rawTarget.replace(/\/$/, '')}`;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const currentPath = selectedVisitor?.visitedPages[selectedVisitor.currentPageIndex]?.path || '/';
  const fullLiveUrl = computeFullUrl(currentPath);

  // Smooth real scrolling inside the virtual browser DOM container
  useEffect(() => {
    if (scrollContainerRef.current && selectedVisitor) {
      const el = scrollContainerRef.current;
      const scrollableHeight = el.scrollHeight - el.clientHeight;
      if (scrollableHeight > 0) {
        const targetScrollTop = (selectedVisitor.currentScrollDepthPct / 100) * scrollableHeight;
        el.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedVisitor?.currentScrollDepthPct, selectedVisitor?.currentPageIndex]);

  // Extract or match job / article data for high-fidelity DOM rendering
  const matchedJob = ALL_VERIFIED_NAIJA_JOBS.find(j => 
    currentPath.includes(j.id) || currentPath.includes(j.path) || (currentPath.includes('job=') && currentPath.includes(j.id))
  ) || ALL_VERIFIED_NAIJA_JOBS[0];

  const matchedArticle = VERIFIED_NAIJA_ARTICLES.find(a => 
    currentPath.includes(a.id) || currentPath.includes(a.path) || (currentPath.includes('article=') && currentPath.includes(a.id))
  );

  const isArticleView = !!matchedArticle || currentPath.includes('article') || currentPath.includes('guide');
  const isJobView = !isArticleView && (currentPath.includes('job') || currentPath.includes('post') || !currentPath.includes('category'));

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullLiveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

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
              <h2 className="text-base font-bold text-white tracking-wide">Live Autonomous Visitor Stream & Simulator</h2>
              {status === 'running' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>DISPATCHING LIVE</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Watching simulated human visitors explore pages, stay, scroll, click links & ads, and send real HTTP requests.
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
            <span>Live Stream</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
              {activeVisitors.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'browser' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Virtual Browser Simulator</span>
            {selectedVisitor && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-mono border border-indigo-500/30">
                {selectedVisitor.country.flag} #{selectedVisitor.visitorNumber}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('http_hits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'http_hits' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Real HTTP Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-300 font-mono">
              {httpHits.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ga4')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ga4' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GA4 Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Active In-Flight</span>
          <div className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-1.5">
            <span>{activeVisitors.length}</span>
            {status === 'running' && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Total Dispatched</span>
          <div className="text-lg font-bold text-white font-mono">{stats.totalVisitorsDispatched}</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Page Views (Hits)</span>
          <div className="text-lg font-bold text-emerald-400 font-mono">{stats.totalPageViews}</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Avg Dwell Time</span>
          <div className="text-lg font-bold text-amber-400 font-mono">{stats.avgEngagementSec}s</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Pages / Session</span>
          <div className="text-lg font-bold text-indigo-400 font-mono">{pagesPerSession}</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-slate-400 text-[11px] block">Bounce Rate</span>
          <div className="text-lg font-bold text-rose-400 font-mono">{bounceRatePct}%</div>
        </div>
      </div>

      {/* Tab 1: Live Visitor Stream Grid */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {activeVisitors.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-12 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-slate-300 font-medium text-sm">No Active Visitors In-Flight</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <span className="text-cyan-400 font-bold">Start Simulation</span> above to dispatch human visitors to crawl and explore your website pages.
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
                    className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 space-y-3.5 cursor-pointer transition-all shadow-lg group relative overflow-hidden"
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
                      <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        (currentPage?.articleLinksClicked || 0) > 0
                          ? 'bg-blue-950/80 border-blue-500/40 text-blue-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Link2 className="w-2.5 h-2.5" />
                        <span>Links: {currentPage?.articleLinksClicked || 0}/{currentPage?.articleLinksPlanned ?? 2}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        (currentPage?.adClicksPerformed || 0) > 0
                          ? 'bg-amber-950/80 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Megaphone className="w-2.5 h-2.5" />
                        <span>Ads: {currentPage?.adClicksPerformed || 0}/{currentPage?.adClicksPlanned ?? 1}</span>
                      </span>

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

            <div className="max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs divide-y divide-slate-900">
              {telemetryEvents.length === 0 ? (
                <div className="text-slate-500 text-center py-4">Waiting for live visitor interactions...</div>
              ) : (
                telemetryEvents.slice(0, 30).map((evt) => (
                  <div key={evt.id} className="pt-1.5 flex items-center justify-between gap-2 text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span>{evt.countryFlag}</span>
                      <span className="text-cyan-400 font-bold">{evt.visitorId.slice(0, 8)}</span>
                      <span className="text-slate-400 truncate">[{evt.eventType}]</span>
                      <span className="truncate text-slate-200">{evt.details}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{evt.pagePath}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enhanced Virtual Browser Viewport Simulator */}
      {activeTab === 'browser' && (
        <div className="space-y-4">
          {/* Top Control Strip: Active Visitor Switcher & Auto-Follow */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {/* Active Visitors Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select Visitor:</span>
              </span>
              {activeVisitors.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No active visitors currently running</span>
              ) : (
                activeVisitors.map((v) => (
                  <button
                    key={v.visitorId}
                    type="button"
                    onClick={() => {
                      setSelectedVisitorId(v.visitorId);
                      setAutoFollow(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedVisitor?.visitorId === v.visitorId
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{v.country.flag}</span>
                    <span>#{v.visitorNumber}</span>
                    <span className="text-[10px] opacity-75">({v.currentScrollDepthPct}%)</span>
                  </button>
                ))
              )}
            </div>

            {/* Auto Follow & Viewport Mode Switcher */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setAutoFollow(!autoFollow)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  autoFollow 
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Automatically switch view to whichever visitor is actively clicking links, ads, or popups"
              >
                <Radio className={`w-3 h-3 ${autoFollow ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>Auto-Follow Live</span>
              </button>

              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewportMode('dom')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewportMode === 'dom' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive DOM
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('iframe')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    viewportMode === 'iframe' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Live Iframe</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Browser Window Frame */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser Top Window Chrome / Address Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Window Controls & Reload */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className={`p-1.5 rounded-lg text-slate-400 bg-slate-950 border border-slate-800 ${
                  selectedVisitor?.status === 'reloading_page' ? 'text-amber-400 bg-amber-950/60 animate-spin' : ''
                }`}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Full Address Bar with Exact Link & Visit Button */}
              <div className="flex-1 max-w-3xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-mono shadow-inner">
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase hidden sm:inline">HTTPS</span>
                  </div>
                  <span className="text-slate-100 font-bold truncate selection:bg-indigo-500 selection:text-white">
                    {fullLiveUrl}
                  </span>
                </div>

                {/* Right Action Icons in Address Bar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedVisitor?.status === 'reloading_page' && (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse whitespace-nowrap">
                      RELOADING (F5)
                    </span>
                  )}
                  
                  {/* Copy URL */}
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="p-1 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                    title="Copy full visited URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Open in New Browser Tab (Fixes navigation test) */}
                  <a
                    href={fullLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-cyan-400 hover:text-white bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 transition-all flex items-center gap-1 px-2 text-[11px] font-sans font-semibold"
                    title="Open this exact listing page in a new browser tab"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Visitor Identity & State Chip */}
              {selectedVisitor && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 shrink-0">
                  <span className="text-lg">{selectedVisitor.country.flag}</span>
                  <span className="font-bold text-slate-200">{selectedVisitor.country.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    Visitor #{selectedVisitor.visitorNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Browser Viewport Stage */}
            {!selectedVisitor ? (
              <div className="p-16 text-center text-slate-500 text-sm">
                No active visitor session selected. Start the simulation to watch human behavior in real-time.
              </div>
            ) : (
              <div className="relative h-[620px] bg-slate-950 overflow-hidden flex flex-col">
                
                {/* 1. Moving Human Mouse Cursor Layer */}
                <div
                  className="absolute pointer-events-none transition-all duration-300 z-50 flex flex-col items-start"
                  style={{
                    left: `${Math.min(92, Math.max(5, selectedVisitor.cursorX))}%`,
                    top: `${Math.min(88, Math.max(8, selectedVisitor.cursorY))}%`,
                  }}
                >
                  <div className="relative">
                    <MousePointer className="w-6 h-6 text-cyan-400 fill-cyan-400/50 drop-shadow-[0_2px_10px_rgba(6,182,212,0.9)] -rotate-12" />
                    
                    {/* Animated Click Ripple Ring */}
                    {(selectedVisitor.status === 'clicking_ad' || selectedVisitor.status === 'clicking_link' || selectedVisitor.status === 'handling_popup') && (
                      <span className="absolute -top-3 -left-3 w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping pointer-events-none" />
                    )}
                  </div>

                  {/* Floating Action Tooltip HUD following the cursor */}
                  <div className="mt-1 bg-slate-950/95 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-[10px] font-mono text-cyan-300 shadow-2xl whitespace-nowrap backdrop-blur-md flex items-center gap-1.5">
                    {selectedVisitor.status === 'clicking_ad' ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Megaphone className="w-3 h-3 animate-bounce" />
                        <span>🎯 Clicking AdSense Banner</span>
                      </span>
                    ) : selectedVisitor.status === 'clicking_link' ? (
                      <span className="text-blue-300 font-bold flex items-center gap-1">
                        <Link2 className="w-3 h-3 animate-bounce" />
                        <span>👆 Clicking Deep Resource Link</span>
                      </span>
                    ) : selectedVisitor.status === 'handling_popup' ? (
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-bounce" />
                        <span>✨ Interacting with Newsletter Popup</span>
                      </span>
                    ) : selectedVisitor.currentScrollDepthPct >= 95 ? (
                      <span className="text-teal-300 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>📜 Reached 100% Footer & Comments</span>
                      </span>
                    ) : (
                      <span>
                        👁️ Reading ({selectedVisitor.currentScrollDepthPct}%) • {selectedVisitor.lastEventLog.slice(0, 32)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Top-Right Real-time Scroll & Behavior Telemetry Badges */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-2 flex-wrap justify-end pointer-events-none">
                  {/* Scroll Meter */}
                  <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 shadow-xl backdrop-blur-sm">
                    <span className="text-slate-400">Page Scroll:</span>
                    <span className={`font-bold ${selectedVisitor.currentScrollDepthPct >= 95 ? 'text-teal-400' : 'text-cyan-400'}`}>
                      {selectedVisitor.currentScrollDepthPct}%
                    </span>
                  </div>

                  {/* Dwell Timer */}
                  <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 shadow-xl backdrop-blur-sm flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {Math.round(selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.dwellSecondsSpent || 0)}s / {selectedVisitor.visitedPages[selectedVisitor.currentPageIndex]?.dwellPlannedSeconds}s
                    </span>
                  </div>
                </div>

                {/* 3. Real Scrollable DOM Webpage Container */}
                {viewportMode === 'iframe' ? (
                  <div className="w-full h-full relative">
                    <iframe
                      src={fullLiveUrl}
                      title="Live Target URL View"
                      className="w-full h-full border-none bg-slate-900"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                      Viewing live webview iframe • Cursor HUD active
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth bg-slate-950/95"
                  >
                    {/* Simulated Full Webpage Header & Nav */}
                    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          9J
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                            <span>NaijaJobs</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">Verified</span>
                          </div>
                          <div className="text-[11px] text-slate-400">Nigeria's Escrow Job Marketplace & Career Hub</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">Browse Jobs</span>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium">Post a Job</span>
                      </div>
                    </div>

                    {/* TOP DISPLAY BANNER AD */}
                    <div className={`max-w-3xl mx-auto rounded-xl p-3.5 flex items-center justify-between text-xs transition-all duration-300 ${
                      selectedVisitor.status === 'clicking_ad'
                        ? 'bg-amber-950/80 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-4 ring-amber-400/30'
                        : 'bg-slate-900/90 border border-dashed border-amber-500/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Megaphone className={`w-4 h-4 ${selectedVisitor.status === 'clicking_ad' ? 'animate-bounce' : ''}`} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-xs">Monnify & Paystack Escrow Payment Gateway 2026</div>
                          <div className="text-[11px] text-slate-400">Google AdSense • Leaderboard Responsive Banner (728x90)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVisitor.status === 'clicking_ad' && (
                          <span className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] font-mono animate-pulse">
                            AD CLICKED!
                          </span>
                        )}
                        <span className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                          Sponsored
                        </span>
                      </div>
                    </div>

                    {/* POPUP / NEWSLETTER OVERLAY MODAL */}
                    {selectedVisitor.status === 'handling_popup' && (
                      <div className="max-w-3xl mx-auto bg-slate-900/90 border-2 border-purple-500 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>INTERSTITIAL PROMO MODAL</span>
                          </div>
                          <button type="button" className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-base font-bold text-white">
                          Get Instant WhatsApp Alerts for High-Paying Nigerian Jobs
                        </h4>
                        <p className="text-xs text-slate-300">
                          Join over 65,000 Nigerian professionals receiving daily vetted listings in Lagos, Abuja, and Port Harcourt.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button type="button" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg">
                            <span>Subscribe Free</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-purple-300 font-mono animate-pulse">
                            • Simulated Human Cursor Clicking Call-To-Action
                          </span>
                        </div>
                      </div>
                    )}

                    {/* MAIN CONTENT CARD: Detailed Single Job Listing View */}
                    {isJobView && matchedJob && (
                      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                        {/* Job Listing Top Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                                {matchedJob.categoryName}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Escrow Protected</span>
                              </span>
                            </div>
                            <h1 className="text-xl font-extrabold text-white leading-snug">
                              {matchedJob.title}
                            </h1>
                            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1 text-slate-300">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{matchedJob.contactOrEmployer || 'Verified Nigerian Employer'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                <span>{matchedJob.location}</span>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>{matchedJob.salaryRange}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Apply Now</span>
                            </button>
                            <button
                              type="button"
                              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Escrow Milestone Security Breakdown */}
                        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <ShieldCheck className="w-4 h-4" />
                              <span>Escrow Milestone Protection Guarantee</span>
                            </div>
                            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                              100% Funds Locked
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Employer has deposited the full project budget in 9jaJobs Escrow. Payment is automatically released only upon your milestone completion and client sign-off.
                          </p>
                        </div>

                        {/* Full Job Description & Scope */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                            Job Description & Requirements
                          </h3>
                          <div className="text-xs text-slate-300 leading-relaxed space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <p>{matchedJob.description}</p>
                            <p>
                              Interested candidates must provide a proven track record, portfolio repository, and availability for immediate milestone-based contract delivery.
                            </p>
                          </div>
                        </div>

                        {/* In-Article Contextual Resource Links */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Related Career Resources & Guides
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                              selectedVisitor.status === 'clicking_link'
                                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/50 animate-pulse'
                                : 'bg-slate-950 text-blue-400 border-blue-500/30'
                            }`}>
                              <Link2 className="w-3 h-3" />
                              <span>10 Proven Tips to Ace High-Paying Job Interviews in Nigeria</span>
                            </span>
                            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                              <Link2 className="w-3 h-3" />
                              <span>Salary Negotiation Guide for Nigerian Tech</span>
                            </span>
                          </div>
                        </div>

                        {/* Verified Applicant Feedback & Reviews */}
                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Applicant Inquiries & Employer Verification</span>
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">3 Verified Comments</span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="font-bold text-slate-200">Emeka O. (Senior React Developer)</span>
                                <span className="text-[10px] text-slate-500">2 hours ago</span>
                              </div>
                              <p className="text-slate-300">
                                Milestone proposal submitted. Ready to commence sprint 1 setup immediately.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ARTICLE VIEW (If user is viewing career guide) */}
                    {isArticleView && (
                      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                        <div className="space-y-2 border-b border-slate-800 pb-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                            Career & Industry Guide
                          </span>
                          <h1 className="text-xl font-bold text-white leading-snug">
                            {matchedArticle?.title || '10 Proven Tips to Ace High-Paying Job Interviews in Nigeria'}
                          </h1>
                          <div className="text-xs text-slate-400 font-mono">
                            Published by 9jaJobs Editorial • 5 min read • Verified 2026
                          </div>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <p>{matchedArticle?.description}</p>
                          <p>
                            When interviewing with top-tier Nigerian banks, multinationals, or high-growth tech startups in Lagos and Abuja, candidate preparation must emphasize concrete milestone results and verifiable impact.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer & End of Page Section */}
                    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500 space-y-2">
                      <div className="text-slate-400 font-bold">9jaJobs Escrow Platform • © 2026 All Rights Reserved</div>
                      <p className="text-[11px] text-slate-500">
                        100% Escrow Milestone Protection for Nigerian Freelancers and Corporate Employers.
                      </p>
                      <div className="text-[10px] font-mono text-teal-400 font-bold pt-2">
                        {selectedVisitor.currentScrollDepthPct >= 95 ? '✓ 100% End of Page (Footer Reached)' : 'Scrolling down through comments...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Real HTTP Hits Log Table */}
      {activeTab === 'http_hits' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Real HTTP In-Flight Dispatch Log ({httpHits.length} Requests)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                LIVE NETWORK DISPATCH
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs">
              {httpHits.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  No HTTP requests dispatched yet. Start the visitor engine to execute real network requests to the target domain.
                </div>
              ) : (
                httpHits.map((hit) => (
                  <div
                    key={hit.id}
                    onClick={() => setSelectedHit(hit)}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hit.status === 200 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300'
                      }`}>
                        HTTP {hit.status}
                      </span>
                      <span className="text-slate-400 text-[11px]">{new Date(hit.timestamp).toLocaleTimeString()}</span>
                      <span className="text-cyan-400 font-bold truncate">{hit.url}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
                      <span>{hit.latencyMs}ms</span>
                      <span className="text-slate-500">{hit.ip}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedHit && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 mt-4 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
                  <span>Selected Request Headers</span>
                  <button type="button" onClick={() => setSelectedHit(null)} className="text-slate-400 hover:text-white">
                    Close
                  </button>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 max-h-36 overflow-y-auto">
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
      )}

      {/* Tab 4: Google Analytics GA4 Real-Time View */}
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
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Geo Locations */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 lg:col-span-2">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Top Active Geographic Locations
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {Object.entries(stats.countryCount).length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-8">No country traffic recorded yet</div>
                ) : (
                  (Object.entries(stats.countryCount) as [string, number][])
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .slice(0, 6)
                    .map(([country, count]) => {
                      const numCount = Number(count);
                      const pct = Math.round((numCount / Math.max(1, stats.totalVisitorsDispatched)) * 100);
                      return (
                        <div key={country} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-300">{country}</span>
                            <span className="text-cyan-400 font-bold">{numCount} visits ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
