import React, { useState } from 'react';
import { 
  Radio, 
  Sparkles, 
  Layers, 
  FileText, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  Search, 
  Tag, 
  Clock, 
  CheckSquare, 
  Square, 
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { DiscoveredRouteItem } from '../types';

interface RecentlyDiscoveredRoutesProps {
  recentRoutes: DiscoveredRouteItem[];
  isCrawling: boolean;
  onTogglePageInclusion?: (pageId: string) => void;
  onUpdatePageWeight?: (pageId: string, weight: number) => void;
  onBoostAllRecent?: () => void;
  onIncludeAllRecent?: () => void;
  targetDomain?: string;
}

export const RecentlyDiscoveredRoutes: React.FC<RecentlyDiscoveredRoutesProps> = ({
  recentRoutes,
  isCrawling,
  onTogglePageInclusion,
  onUpdatePageWeight,
  onBoostAllRecent,
  onIncludeAllRecent,
  targetDomain,
}) => {
  const [filter, setFilter] = useState<'all' | 'post' | 'category' | 'page'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Format relative timestamp
  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  // Helper to format source label
  const getSourceBadge = (source: DiscoveredRouteItem['sourceType']) => {
    switch (source) {
      case 'dom_pattern':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono">DOM Pattern</span>;
      case 'script_bundle':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">Script Chunk</span>;
      case 'json_ld':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono">JSON-LD</span>;
      case 'sitemap':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">Sitemap</span>;
      case 'url_query':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/80 border border-blue-500/30 text-blue-300 font-mono">Query Param</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono">HTML Link</span>;
    }
  };

  // Helper to render category badge
  const renderCategoryBadge = (category?: string) => {
    switch (category) {
      case 'post':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/90 border border-indigo-500/50 text-indigo-300">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>LISTING / POST</span>
          </span>
        );
      case 'category':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 border border-amber-500/50 text-amber-300">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>CATEGORY</span>
          </span>
        );
      case 'product':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/90 border border-rose-500/50 text-rose-300">
            <Tag className="w-3 h-3 text-rose-400" />
            <span>PRODUCT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>CORE PAGE</span>
          </span>
        );
    }
  };

  // Filtered recent routes
  const filteredRoutes = recentRoutes.filter(route => {
    if (filter !== 'all') {
      if (filter === 'post' && route.category !== 'post') return false;
      if (filter === 'category' && route.category !== 'category') return false;
      if (filter === 'page' && route.category === 'post' || route.category === 'category') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        route.path.toLowerCase().includes(q) ||
        route.title.toLowerCase().includes(q) ||
        (route.description && route.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const recentListingsCount = recentRoutes.filter(r => r.category === 'post').length;
  const recentCategoriesCount = recentRoutes.filter(r => r.category === 'category').length;

  return (
    <div 
      id="recently-discovered-routes-feed"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5"
    >
      {/* Header with Live Pulse and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${
            isCrawling 
              ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 animate-pulse' 
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
          }`}>
            <Radio className={`w-4 h-4 ${isCrawling ? 'animate-spin text-cyan-400' : 'text-indigo-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Recently Discovered Routes</span>
              </h3>
              {isCrawling ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>STREAMING</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  <span>{recentRoutes.length} Discovered</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live feed of newly detected query parameters, job listings, blog posts, and category hubs.
            </p>
          </div>
        </div>

        {/* Batch Action Buttons */}
        {recentRoutes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {onIncludeAllRecent && (
              <button
                type="button"
                onClick={onIncludeAllRecent}
                className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Include all recently discovered routes in traffic distribution"
              >
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Include All Recent</span>
              </button>
            )}
            {onBoostAllRecent && (
              <button
                type="button"
                onClick={onBoostAllRecent}
                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Set 95% visit weight to all recent job listings and posts"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Boost Recent Listings ({recentListingsCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Recent ({recentRoutes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('post')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'post' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>Listings & Posts ({recentListingsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('category')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'category' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Categories ({recentCategoriesCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recent routes..."
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-full sm:w-52"
          />
        </div>
      </div>

      {/* Routes Stream Feed Container */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden shadow-inner">
        {filteredRoutes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {isCrawling ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                <p className="text-slate-300 font-medium">Scanning DOM tree and script bundles for new routes...</p>
                <p className="text-[11px] text-slate-500">Newly discovered links will appear here dynamically in real-time.</p>
              </div>
            ) : recentRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <FolderTree className="w-6 h-6 text-slate-600" />
                <p className="text-slate-400 font-medium">No recent routes discovered in this session</p>
                <p className="text-[11px] text-slate-600">Start a site crawl or enter a target URL above to discover active pages and listings.</p>
              </div>
            ) : (
              <p>No recently discovered routes match your filter query.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {filteredRoutes.map((route, idx) => (
              <div 
                key={route.id || `${route.path}_${idx}`}
                className="p-3 hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                {/* Left: Path, Title, Badges */}
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <div className="pt-0.5 sm:pt-0">
                    {renderCategoryBadge(route.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 text-xs truncate max-w-[260px] sm:max-w-md">
                        {route.path}
                      </span>
                      {getSourceBadge(route.sourceType)}
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{formatRelativeTime(route.discoveredAt)}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-medium truncate mt-1" title={route.title}>
                      {route.title}
                    </div>
                  </div>
                </div>

                {/* Right: Quick actions & Link */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onUpdatePageWeight && (
                    <button
                      type="button"
                      onClick={() => onUpdatePageWeight(route.id, 98)}
                      className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      title="Boost this listing probability to 98%"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Boost</span>
                    </button>
                  )}
                  {route.url && (
                    <a
                      href={route.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
                      title="Open discovered route in new tab"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
