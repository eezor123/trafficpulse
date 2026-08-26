import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Radio,
  FileText,
  FolderTree,
  Tag,
  ExternalLink,
  CheckSquare,
  Square,
  Search,
  Zap,
  Sliders,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Flame,
  Trash2
} from 'lucide-react';
import { CrawledPage, SiteCrawlState, TestStatus } from '../types';

interface CrawledUrlsRadarClockProps {
  crawlState: SiteCrawlState;
  status: TestStatus;
  activeVisitorsCount: number;
  onTogglePageInclusion: (pageId: string) => void;
  onUpdatePageWeight: (pageId: string, weight: number) => void;
  onStartCrawl?: (url?: string) => void;
  onClearAllPages?: () => void;
}

export const CrawledUrlsRadarClock: React.FC<CrawledUrlsRadarClockProps> = ({
  crawlState,
  status,
  activeVisitorsCount,
  onTogglePageInclusion,
  onUpdatePageWeight,
  onStartCrawl,
  onClearAllPages,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<'all' | 'post' | 'page' | 'category' | 'tag'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isPingingUrl, setIsPingingUrl] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<Record<string, { status: number; latency: number; ok: boolean }>>({});

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const formattedLocalTime = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const formattedUtcTime = currentTime.toUTCString().slice(17, 25) + ' UTC';

  // Clock hand angles (360 degrees)
  const secondsAngle = (seconds / 60) * 360;
  const minutesAngle = ((minutes + seconds / 60) / 60) * 360;
  const hoursAngle = (((hours % 12) + minutes / 60) / 12) * 360;

  // Categorize pages
  const allPages = crawlState.pages || [];
  const posts = allPages.filter(p => p.category === 'post');
  const pages = allPages.filter(p => p.category === 'page' || !p.category);
  const categories = allPages.filter(p => p.category === 'category');
  const tags = allPages.filter(p => p.category === 'tag' || p.category === 'archive');

  const includedCount = allPages.filter(p => p.includedInVisits).length;
  const activePercent = allPages.length > 0 ? Math.round((includedCount / allPages.length) * 100) : 0;

  // Filtered pages based on active tab and search
  const filteredPages = allPages.filter(p => {
    if (activeCategory === 'post' && p.category !== 'post') return false;
    if (activeCategory === 'page' && p.category !== 'page' && p.category !== undefined) return false;
    if (activeCategory === 'category' && p.category !== 'category') return false;
    if (activeCategory === 'tag' && p.category !== 'tag' && p.category !== 'archive') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.path.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSelectAll = (select: boolean) => {
    allPages.forEach(p => {
      if (p.includedInVisits !== select) {
        onTogglePageInclusion(p.id);
      }
    });
  };

  const handleBoostCategory = (cat: 'post' | 'category' | 'page', boostWeight: number) => {
    allPages.forEach(p => {
      const match = (p.category || 'page') === cat;
      if (match) {
        onUpdatePageWeight(p.id, boostWeight);
      }
    });
  };

  const handleTestUrlPing = async (url: string, pageId: string) => {
    setIsPingingUrl(pageId);
    try {
      const res = await fetch('/api/traffic/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, targetUrl: url }),
      });
      const data = await res.json();
      setPingStatus(prev => ({
        ...prev,
        [pageId]: {
          status: data.statusCode || 200,
          latency: data.latencyMs || 45,
          ok: data.reachable ?? true,
        },
      }));
    } catch {
      setPingStatus(prev => ({
        ...prev,
        [pageId]: { status: 0, latency: 0, ok: false },
      }));
    } finally {
      setIsPingingUrl(null);
    }
  };

  // Render radar markers positioned around clock circle
  const maxClockDots = Math.min(24, allPages.length);
  const clockNodes = allPages.slice(0, maxClockDots).map((page, idx) => {
    const angleRad = (idx / maxClockDots) * 2 * Math.PI - Math.PI / 2;
    const radius = 80; // px
    const cx = 110 + radius * Math.cos(angleRad);
    const cy = 110 + radius * Math.sin(angleRad);
    const isPost = page.category === 'post';
    const isCat = page.category === 'category';
    const color = isPost ? '#818cf8' : isCat ? '#fbbf24' : '#34d399';
    return { page, cx, cy, color, idx };
  });

  return (
    <div id="crawled-urls-clock-dashboard" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            {status === 'running' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Live Crawled Content Radar & Real-Time URL Clock</h2>
              {status === 'running' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>TRAFFIC DISPATCHING ACTIVE</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  RADAR READY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Visualizing all discovered live posts, pages, and categories orbiting in the real-time visit schedule.
            </p>
          </div>
        </div>

        {/* Quick Crawl Action & Domain Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[180px] font-semibold">{crawlState.hostname || 'Target Site'}</span>
          </div>
          {onStartCrawl && (
            <button
              type="button"
              onClick={() => onStartCrawl(crawlState.targetUrl)}
              disabled={crawlState.isCrawling}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
              <span>{crawlState.isCrawling ? 'Scanning...' : 'Re-Crawl'}</span>
            </button>
          )}
          {onClearAllPages && (
            <button
              type="button"
              onClick={onClearAllPages}
              disabled={allPages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 disabled:opacity-40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Clear all URLs from the radar clock and graph"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Graph</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Grid: Chronometer Radar Clock on Left, Summary Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Interactive Chronometer & Rotating Radar Clock */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800/90 rounded-xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Subtle Background Radar Scan Effect */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />

          {/* Time Displays */}
          <div className="w-full flex items-center justify-between text-xs border-b border-slate-800/80 pb-3 z-10">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-medium text-slate-200">{formattedLocalTime}</span>
              <span className="text-[10px] text-slate-500">LOCAL</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {formattedUtcTime}
            </div>
          </div>

          {/* SVG Radar Clock Face */}
          <div className="relative my-4 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220" className="z-10 drop-shadow-lg">
              {/* Outer Radar Rings */}
              <circle cx="110" cy="110" r="100" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="110" cy="110" r="75" fill="none" stroke="#334155" strokeWidth="1" />
              <circle cx="110" cy="110" r="50" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="110" cy="110" r="25" fill="none" stroke="#334155" strokeWidth="1" />

              {/* Crosshair Axes */}
              <line x1="110" y1="10" x2="110" y2="210" stroke="#334155" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="10" y1="110" x2="210" y2="110" stroke="#334155" strokeWidth="1" strokeOpacity="0.6" />

              {/* Cardinal Hour Marks */}
              <text x="110" y="24" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">12h</text>
              <text x="200" y="113" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">3h</text>
              <text x="110" y="204" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">6h</text>
              <text x="20" y="113" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">9h</text>

              {/* Empty Radar State Indicator */}
              {allPages.length === 0 && (
                <g>
                  <text x="110" y="106" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">URL Graph Empty</text>
                  <text x="110" y="122" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="monospace">0 routes active</text>
                </g>
              )}

              {/* Crawled URL Orbit Nodes */}
              {clockNodes.map(({ page, cx, cy, color, idx }) => (
                <g key={page.id || idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={page.includedInVisits ? '4' : '2.5'}
                    fill={page.includedInVisits ? color : '#475569'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:scale-150"
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <title>{page.title} ({page.path})</title>
                  </circle>
                  {status === 'running' && page.includedInVisits && idx % 4 === (seconds % 4) && (
                    <circle cx={cx} cy={cy} r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.8" className="animate-ping" />
                  )}
                </g>
              ))}

              {/* Hour Hand */}
              <line
                x1="110"
                y1="110"
                x2={110 + 40 * Math.sin((hoursAngle * Math.PI) / 180)}
                y2={110 - 40 * Math.cos((hoursAngle * Math.PI) / 180)}
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Minute Hand */}
              <line
                x1="110"
                y1="110"
                x2={110 + 60 * Math.sin((minutesAngle * Math.PI) / 180)}
                y2={110 - 60 * Math.cos((minutesAngle * Math.PI) / 180)}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Second Hand (Radar Sweep) */}
              <line
                x1="110"
                y1="110"
                x2={110 + 78 * Math.sin((secondsAngle * Math.PI) / 180)}
                y2={110 - 78 * Math.cos((secondsAngle * Math.PI) / 180)}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Center Pivot Point */}
              <circle cx="110" cy="110" r="4.5" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" />
            </svg>

            {/* Pulsing center badge */}
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-indigo-500/30">
                {allPages.length} URLs
              </span>
            </div>
          </div>

          {/* Clock Dial Footer Legend */}
          <div className="w-full flex items-center justify-center gap-3 text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Posts ({posts.length})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Categories ({categories.length})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Pages ({pages.length})</span>
            </span>
          </div>
        </div>

        {/* Right: Crawled Content Distribution & Metrics Summary Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Total Discovered */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total URLs</span>
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                {allPages.length}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {includedCount} in live rotation ({activePercent}%)
              </div>
            </div>

            {/* Posts / Articles */}
            <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Live Posts</span>
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-300 mt-1">
                {posts.length}
              </div>
              <div className="text-[10px] text-indigo-400/80 font-mono mt-0.5">
                Articles & Stories
              </div>
            </div>

            {/* Taxonomies & Categories */}
            <div className="bg-slate-950/80 border border-amber-900/40 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Categories</span>
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                {categories.length}
              </div>
              <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                Topics & Hubs
              </div>
            </div>

            {/* Core Pages & Landing */}
            <div className="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Core Pages</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                {pages.length}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                Landing & Utility
              </div>
            </div>
          </div>

          {/* Quick Category Multi-Selector & Traffic Weight Boost Controls */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rotation Distribution & Category Weights</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  disabled={allPages.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] font-medium text-slate-200 cursor-pointer transition-all flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  disabled={allPages.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] font-medium text-slate-200 cursor-pointer transition-all flex items-center gap-1"
                >
                  <Square className="w-3 h-3 text-slate-400" />
                  <span>Deselect All</span>
                </button>
                {onClearAllPages && allPages.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllPages}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-[11px] font-medium text-rose-300 cursor-pointer transition-all flex items-center gap-1"
                    title="Clear all URLs from the radar clock"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear ({allPages.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Weight Boost Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleBoostCategory('post', 90)}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Flame className="w-3 h-3 text-indigo-400" />
                <span>Boost All Posts (90% Weight)</span>
              </button>
              <button
                type="button"
                onClick={() => handleBoostCategory('category', 80)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900/60 text-amber-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                <FolderTree className="w-3 h-3 text-amber-400" />
                <span>Boost Categories (80% Weight)</span>
              </button>
              <button
                type="button"
                onClick={() => handleBoostCategory('page', 70)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Standard Pages (70% Weight)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crawled URL Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All URLs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {allPages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('post')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'post' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3 h-3 text-indigo-400" />
            <span>Posts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-indigo-300 font-mono">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('category')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'category' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3 h-3 text-amber-400" />
            <span>Categories</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300 font-mono">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('page')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'page' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Pages</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-300 font-mono">
              {pages.length}
            </span>
          </button>

          {tags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory('tag')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'tag' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3 h-3 text-purple-400" />
              <span>Tags</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-purple-300 font-mono">
                {tags.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crawled URL or title..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Crawled URL List Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/80">
          {filteredPages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No URLs found matching your criteria. Try scanning the target website.
            </div>
          ) : (
            filteredPages.map((page, index) => {
              const isSelected = selectedPageId === page.id;
              const isPost = page.category === 'post';
              const isCategory = page.category === 'category';
              const isTag = page.category === 'tag';
              const isPinging = isPingingUrl === page.id;
              const pStatus = pingStatus[page.id];

              const targetBase = (crawlState.targetUrl && crawlState.targetUrl.trim())
                ? (crawlState.targetUrl.startsWith('http') ? crawlState.targetUrl.replace(/\/$/, '') : `https://${crawlState.targetUrl.replace(/\/$/, '')}`)
                : 'https://9jajobs.vercel.app';
              const fullPageUrl = (page.url && page.url.startsWith('http'))
                ? page.url
                : `${targetBase}${page.path.startsWith('/') ? page.path : `/${page.path}`}`;

              return (
                <div
                  key={page.id || index}
                  className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors ${
                    !page.includedInVisits ? 'opacity-50 bg-slate-950/40' : ''
                  }`}
                >
                  {/* Left Column: Checkbox, Category Badge, Title & URL */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onTogglePageInclusion(page.id)}
                      className="text-slate-400 hover:text-indigo-400 cursor-pointer shrink-0"
                    >
                      {page.includedInVisits ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    {/* Category Badge */}
                    <div className="shrink-0">
                      {isPost ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          <span>POST</span>
                        </span>
                      ) : isCategory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <FolderTree className="w-2.5 h-2.5" />
                          <span>CATEGORY</span>
                        </span>
                      ) : isTag ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>TAG</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>PAGE</span>
                        </span>
                      )}
                    </div>

                    {/* Title and Path */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {page.title || page.path}
                        </span>
                        {pStatus && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            pStatus.ok ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300'
                          }`}>
                            HTTP {pStatus.status} ({pStatus.latency}ms)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400/80 truncate mt-0.5">
                        {page.path}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Weight Adjustment, Ping Test, External Link */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Weight Slider / Numeric input */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-medium">Weight:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={page.visitWeight || 50}
                        onChange={(e) => onUpdatePageWeight(page.id, parseInt(e.target.value, 10) || 50)}
                        className="w-10 bg-transparent text-right font-mono font-bold text-indigo-300 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                    </div>

                    {/* Ping Test Button */}
                    <button
                      type="button"
                      onClick={() => handleTestUrlPing(fullPageUrl, page.id)}
                      disabled={isPinging}
                      title={`Test HTTP Ping to ${fullPageUrl}`}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce text-amber-400' : ''}`} />
                    </button>

                    {/* External Link */}
                    <a
                      href={fullPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-all flex items-center gap-1"
                      title={`Open exact listing page: ${fullPageUrl}`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
