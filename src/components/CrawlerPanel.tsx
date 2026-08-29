import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Link2,
  FileText,
  FolderTree,
  Tag,
  CheckSquare,
  Square,
  ShieldCheck,
  UploadCloud,
  Zap,
  X
} from 'lucide-react';
import { CrawledPage, SiteCrawlState, DiscoveredRouteItem } from '../types';
import { parseRawJobText } from '../utils/jobTextParser';
import { ALL_VERIFIED_NAIJA_JOBS } from '../data/allNaijaJobListings';
import { CrawlProgressBar } from './CrawlProgressBar';
import { RecentlyDiscoveredRoutes } from './RecentlyDiscoveredRoutes';

interface CrawlerPanelProps {
  crawlState: SiteCrawlState;
  onUpdateTargetUrl: (url: string) => void;
  onStartCrawl: (urlOverride?: string) => void;
  onTogglePageInclusion: (pageId: string) => void;
  onUpdatePageWeight: (pageId: string, weight: number) => void;
  onAddCustomPage: (path: string, title: string) => void;
  onRemovePage: (pageId: string) => void;
  onAutoPopulateRoutes: () => void;
  onClearAllPages?: () => void;
  onResetCrawler?: () => void;
}

export const CrawlerPanel: React.FC<CrawlerPanelProps> = ({
  crawlState,
  onUpdateTargetUrl,
  onStartCrawl,
  onTogglePageInclusion,
  onUpdatePageWeight,
  onAddCustomPage,
  onRemovePage,
  onAutoPopulateRoutes,
  onClearAllPages,
  onResetCrawler,
}) => {
  const [customPath, setCustomPath] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [urlInput, setUrlInput] = useState(crawlState.targetUrl);
  const [activeFilter, setActiveFilter] = useState<'all' | 'post' | 'category' | 'page' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setUrlInput(crawlState.targetUrl);
  }, [crawlState.targetUrl]);

  // Helper to parse any raw input (URL, query, ID, path) into clean path and title
  const parseListingInput = (raw: string, userTitle?: string): { path: string; title: string; category: 'post' | 'category' | 'page' } => {
    const trimmed = raw.trim();
    let formattedPath = trimmed;
    let fallbackTitle = userTitle?.trim() || '';
    let category: 'post' | 'category' | 'page' = 'page';

    // 1. Raw Job/Post ID (e.g. job_1787164089747 or job_1785681865131)
    if (/^job_\d{3,25}$/i.test(trimmed) || /^job_[a-zA-Z0-9_\-]+$/i.test(trimmed)) {
      formattedPath = `/?job=${trimmed}`;
      fallbackTitle = trimmed === 'job_1787164089747' 
        ? 'Male Barbecue sales person is urgently needed' 
        : `Job Listing (${trimmed})`;
      category = 'post';
    } else if (/^post_\d{3,25}$/i.test(trimmed)) {
      formattedPath = `/?post=${trimmed}`;
      fallbackTitle = `Post Listing (${trimmed})`;
      category = 'post';
    } else if (/^article_\d{3,25}$/i.test(trimmed)) {
      formattedPath = `/article/${trimmed}`;
      fallbackTitle = `Article (${trimmed})`;
      category = 'post';
    }
    // 2. Full URL (e.g. https://jobs.eezor.com/?job=job_1787164089747)
    else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        formattedPath = `${parsed.pathname || '/'}${parsed.search || ''}`;
        const qJob = parsed.searchParams.get('job');
        const qPost = parsed.searchParams.get('post');
        const qListing = parsed.searchParams.get('listing');
        const qCat = parsed.searchParams.get('category') || parsed.searchParams.get('cat');

        if (qJob) {
          const cleanJobId = qJob.replace(/^job_/, '');
          fallbackTitle = isNaN(Number(cleanJobId))
            ? `Job: ${cleanJobId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
            : `Job Listing #${cleanJobId}`;
          category = 'post';
        } else if (qPost) {
          const cleanPostId = qPost.replace(/^post_/, '');
          fallbackTitle = `Post: ${cleanPostId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
          category = 'post';
        } else if (qListing) {
          fallbackTitle = `Listing: ${qListing}`;
          category = 'post';
        } else if (qCat) {
          fallbackTitle = `Category: ${qCat.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
          category = 'category';
        } else if (parsed.pathname.includes('/category/')) {
          category = 'category';
          fallbackTitle = parsed.pathname.split('/category/')[1]?.replace(/[-_/]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Category';
        } else if (parsed.pathname.includes('/job/') || parsed.pathname.includes('/post/') || parsed.pathname.includes('/article/')) {
          category = 'post';
          fallbackTitle = parsed.pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Listing';
        }
      } catch {
        formattedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      }
    }
    // 3. Query string only (e.g. ?job=job_1787164089747)
    else if (trimmed.startsWith('?')) {
      formattedPath = `/${trimmed}`;
      const sp = new URLSearchParams(trimmed);
      const qJob = sp.get('job');
      const qPost = sp.get('post');
      const qCat = sp.get('category') || sp.get('cat');
      if (qJob) {
        const cleanJobId = qJob.replace(/^job_/, '');
        fallbackTitle = isNaN(Number(cleanJobId))
          ? `Job: ${cleanJobId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
          : `Job Listing #${cleanJobId}`;
        category = 'post';
      } else if (qPost) {
        const cleanPostId = qPost.replace(/^post_/, '');
        fallbackTitle = `Post: ${cleanPostId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
        category = 'post';
      } else if (qCat) {
        fallbackTitle = `Category: ${qCat.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
        category = 'category';
      }
    }
    // 4. Path string
    else {
      formattedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      if (formattedPath.includes('/category/')) category = 'category';
      else if (formattedPath.includes('/job/') || formattedPath.includes('/post/') || formattedPath.includes('/article/')) category = 'post';
    }

    const finalTitle = userTitle?.trim() || fallbackTitle || formattedPath.replace(/^\//, '').replace(/[-_?=&]/g, ' ') || 'Listing Page';
    return { path: formattedPath, title: finalTitle, category };
  };

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPath.trim()) return;
    const { path, title } = parseListingInput(customPath, customTitle);
    onAddCustomPage(path, title);
    setFeedbackMessage(`Added Listing: "${title}" (${path})`);
    setActiveFilter('all');
    setCustomPath('');
    setCustomTitle('');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleBulkImport = () => {
    const raw = bulkInput.trim();
    if (!raw) return;

    let count = 0;

    // Check if input is multi-line formatted job text (e.g. copied from job portal or WhatsApp)
    if (raw.includes('📍') || raw.includes('₦') || raw.includes('Job Title:') || raw.includes('Urgent Recruitment')) {
      const parsedPages = parseRawJobText(raw, crawlState.origin);
      if (parsedPages.length > 0) {
        parsedPages.forEach(p => {
          onAddCustomPage(p.path, p.title);
          count++;
        });
      }
    }

    // Also process line-by-line IDs/URLs
    if (count === 0) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach(line => {
        const parts = line.split('|');
        const rawUrlOrId = parts[0].trim();
        const rawTitle = parts[1]?.trim();
        if (rawUrlOrId) {
          const { path, title } = parseListingInput(rawUrlOrId, rawTitle);
          onAddCustomPage(path, title);
          count++;
        }
      });
    }

    setFeedbackMessage(`Imported ${count} listings/routes.`);
    setActiveFilter('all');
    setBulkInput('');
    setShowBulkModal(false);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleImportAllVerifiedListings = () => {
    let count = 0;
    ALL_VERIFIED_NAIJA_JOBS.forEach(job => {
      onAddCustomPage(job.path, job.title);
      count++;
    });
    setFeedbackMessage(`Loaded all ${count} verified listings into route catalog!`);
    setActiveFilter('all');
    setShowBulkModal(false);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    const formatted = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')
      ? cleanUrl
      : `https://${cleanUrl}`;
    onUpdateTargetUrl(formatted);
    onStartCrawl(formatted);
  };

  const handleSelectAll = (select: boolean) => {
    crawlState.pages.forEach(p => {
      if (p.includedInVisits !== select) {
        onTogglePageInclusion(p.id);
      }
    });
  };

  const handleBoostListingsAndPosts = () => {
    crawlState.pages.forEach(p => {
      if (p.category === 'post' || p.path.includes('job') || p.path.includes('post') || p.path.includes('article')) {
        if (!p.includedInVisits) onTogglePageInclusion(p.id);
        onUpdatePageWeight(p.id, 95);
      }
    });
  };

  const includedPagesCount = crawlState.pages.filter(p => p.includedInVisits).length;
  const postsCount = crawlState.pages.filter(p => p.category === 'post' || p.path.includes('job=') || p.path.includes('post=') || p.path.includes('article')).length;
  const categoriesCount = crawlState.pages.filter(p => p.category === 'category' || p.path.includes('category')).length;
  const pagesCount = crawlState.pages.filter(p => (p.category === 'page' || !p.category) && !p.path.includes('job=') && !p.path.includes('post=') && !p.path.includes('category')).length;

  const filteredPages = crawlState.pages.filter(page => {
    const isPost = page.category === 'post' || page.path.includes('job=') || page.path.includes('post=') || page.path.includes('article');
    const isCategory = page.category === 'category' || page.path.includes('/category/') || page.path.includes('category=');

    if (activeFilter === 'post' && !isPost) return false;
    if (activeFilter === 'category' && !isCategory) return false;
    if (activeFilter === 'page' && (isPost || isCategory)) return false;
    if (activeFilter === 'other' && (isPost || isCategory || page.category === 'page')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return page.path.toLowerCase().includes(q) || page.title.toLowerCase().includes(q);
    }
    return true;
  });

  const renderBadge = (page: CrawledPage) => {
    const cat = page.category;
    const isJobOrPost = cat === 'post' || page.path.includes('job=') || page.path.includes('post=') || page.path.includes('article');
    const isCat = cat === 'category' || page.path.includes('category');
    const isDomCard = page.id.startsWith('dom_') || page.id.startsWith('dom_rec_') || page.description.includes('DOM');

    if (isJobOrPost) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-500/40">
          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
          <span>{isDomCard ? 'DOM LISTING CARD' : 'LISTING / POST'}</span>
        </span>
      );
    }
    if (isCat) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40">
          <Tag className="w-2.5 h-2.5 text-amber-400" />
          <span>CATEGORY HUB</span>
        </span>
      );
    }
    if (cat === 'product') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">PRODUCT</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-700">PAGE</span>;
  };

  // Helper to boost weight of all recent routes
  const handleBoostRecentRoutes = () => {
    if (!crawlState.recentlyDiscoveredRoutes || crawlState.recentlyDiscoveredRoutes.length === 0) return;
    const recentPaths = new Set(crawlState.recentlyDiscoveredRoutes.map(r => r.path));
    crawlState.pages.forEach(p => {
      if (recentPaths.has(p.path)) {
        onUpdatePageWeight(p.id, 98);
      }
    });
    setFeedbackMessage(`Boosted visit probability to 98% for all ${crawlState.recentlyDiscoveredRoutes.length} recent routes.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Helper to include all recent routes
  const handleIncludeAllRecentRoutes = () => {
    if (!crawlState.recentlyDiscoveredRoutes || crawlState.recentlyDiscoveredRoutes.length === 0) return;
    const recentPaths = new Set(crawlState.recentlyDiscoveredRoutes.map(r => r.path));
    crawlState.pages.forEach(p => {
      if (recentPaths.has(p.path) && !p.includedInVisits) {
        onTogglePageInclusion(p.id);
      }
    });
    setFeedbackMessage(`Included all ${crawlState.recentlyDiscoveredRoutes.length} recent routes in organic traffic campaign.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Target Input & Scraper Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Target Web Application & Deep Route Discovery</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically reverse-engineers dynamic SPAs (React, Vite, Next.js), sitemaps, JSON-LD, and dynamic listing parameters.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bulk Import URLs / IDs</span>
              </button>
              <button
                type="button"
                onClick={handleBoostListingsAndPosts}
                disabled={crawlState.pages.length === 0}
                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 disabled:opacity-40 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Set 95% visit probability to all job listings, articles, and posts"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Boost All Listings</span>
              </button>
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                disabled={crawlState.pages.length === 0 && !crawlState.hostname}
                className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 disabled:opacity-40 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Clear all crawled URLs and reset site crawler graph"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear All URLs ({crawlState.pages.length})</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://jobs.eezor.com or https://jobs.eezor.com/?job=job_1787164089747"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={crawlState.isCrawling || !urlInput.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
              <span>{crawlState.isCrawling ? 'Crawling Site...' : 'Crawl All Posts & Pages'}</span>
            </button>
          </form>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Quick Test Targets:</span>
            {[
              { label: 'Eezor Jobs Main', url: 'https://jobs.eezor.com' },
              { label: 'Eezor Barbecue Job Listing', url: 'https://jobs.eezor.com/?job=job_1787164089747' },
              { label: '9jaJobs Portal (SPA)', url: 'https://9jajobs.vercel.app' },
              { label: 'Eezor Store', url: 'https://eezor.com' },
              { label: 'Techpoint Africa', url: 'https://techpoint.africa' },
            ].map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  setUrlInput(preset.url);
                  onUpdateTargetUrl(preset.url);
                  onStartCrawl(preset.url);
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 transition-colors font-mono cursor-pointer flex items-center gap-1"
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Crawl Progress Bar */}
      <CrawlProgressBar
        isCrawling={crawlState.isCrawling}
        progressPct={crawlState.crawlProgressPct}
        phase={crawlState.crawlPhase}
        currentScanningUrl={crawlState.currentScanningUrl}
        discoveredCount={crawlState.pages.length}
        postsCount={postsCount}
        categoriesCount={categoriesCount}
        pagesCount={pagesCount}
        visitedUrlsCount={crawlState.visitedUrlsCount}
        targetUrl={crawlState.targetUrl}
        statusCode={crawlState.statusCode}
        latencyMs={crawlState.latencyMs}
      />

      {/* Recently Discovered Routes Feed */}
      <RecentlyDiscoveredRoutes
        recentRoutes={crawlState.recentlyDiscoveredRoutes || []}
        isCrawling={crawlState.isCrawling}
        onTogglePageInclusion={onTogglePageInclusion}
        onUpdatePageWeight={onUpdatePageWeight}
        onBoostAllRecent={handleBoostRecentRoutes}
        onIncludeAllRecent={handleIncludeAllRecentRoutes}
        targetDomain={crawlState.hostname}
      />

      {/* Crawled Target Summary Banner & Recursive Link-Discovery Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Target Domain</span>
          <div className="text-sm font-semibold text-cyan-300 font-mono truncate mt-0.5" title={crawlState.targetUrl}>
            {crawlState.hostname || 'example.com'}
          </div>
          {crawlState.statusCode && (
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              HTTP {crawlState.statusCode} • {crawlState.latencyMs}ms
            </div>
          )}
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Content Coverage</span>
          <div className="text-sm font-medium text-slate-200 truncate mt-0.5" title={crawlState.title}>
            <span className="text-indigo-400 font-bold">{postsCount}</span> Listings/Posts • <span className="text-amber-400 font-bold">{categoriesCount}</span> Cats
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {crawlState.realLinksCount !== undefined ? `${crawlState.realLinksCount} links` : `${crawlState.pages.length} links`} • Depth {crawlState.recursivePassDepth ?? 2}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Recursive Engine Guard</span>
          <div className="text-xs font-medium text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Zero-Loop Guard ({crawlState.visitedUrlsCount ?? crawlState.pages.length} URLs)</span>
            </span>
          </div>
          <div className="text-[10px] text-indigo-300 font-mono mt-1">
            {crawlState.listingPatternsMatched ?? postsCount} DOM listing/post patterns
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Analytics Status</span>
          <div className="text-xs font-mono mt-1 flex items-center gap-1.5">
            {crawlState.gaMeasurementId ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{crawlState.gaMeasurementId}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px]">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>GA4 Beacon Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recursive Link-Discovery Engine Highlights & DOM Pattern Priority Mode */}
      <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <span>Recursive DOM Link-Discovery Pass</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 text-[10px] border border-indigo-500/30">PRIORITY ENGINE ACTIVE</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tracks <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">visitedUrls: Set&lt;string&gt;</code> to eliminate infinite crawl loops while prioritizing <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">&lt;article&gt;</code>, <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">?job=</code>, <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">?post=</code>, and <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">[data-job-id]</code> DOM structures.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => onStartCrawl(crawlState.targetUrl)}
            disabled={crawlState.isCrawling || !crawlState.targetUrl}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
            <span>Run Recursive Pass</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {crawlState.error && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Crawler notice: {crawlState.error}. Default and fallback navigation routes have been supplied.</span>
        </div>
      )}

      {/* Pages Discovery Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Routes ({crawlState.pages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('post')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'post' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>Listings & Posts ({postsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('category')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'category' ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Categories ({categoriesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('page')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'page' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Core Pages ({pagesCount})
            </button>
          </div>

          {/* Quick Select & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onStartCrawl(crawlState.targetUrl)}
              disabled={crawlState.isCrawling}
              className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] rounded font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title="Rescan and pull all 53+ discovered listings from server"
            >
              <RefreshCw className={`w-3 h-3 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
              <span>{crawlState.isCrawling ? 'Crawling...' : 'Sync Site Routes'}</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter routes..."
                className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-32 sm:w-40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              disabled={crawlState.pages.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-200 rounded font-medium cursor-pointer"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              disabled={crawlState.pages.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-200 rounded font-medium cursor-pointer"
            >
              None
            </button>
            {crawlState.pages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-[11px] text-rose-300 rounded font-medium cursor-pointer flex items-center gap-1 transition-all"
                title="Clear all URLs from this crawler table"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear ({crawlState.pages.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Active</th>
                  <th className="py-2.5 px-3">Path & Listing Title</th>
                  <th className="py-2.5 px-3 w-36">Type</th>
                  <th className="py-2.5 px-3 w-40">Visit Probability</th>
                  <th className="py-2.5 px-3 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {crawlState.pages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                          <FolderTree className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200">No Crawled URLs in Graph</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            The site crawler and URL graph are currently empty. Crawl your target site, import URLs, or load starter sample routes.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                          <button
                            type="button"
                            onClick={() => onStartCrawl(crawlState.targetUrl)}
                            disabled={crawlState.isCrawling || !crawlState.targetUrl}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/30"
                          >
                            <RefreshCw className={`w-3 h-3 ${crawlState.isCrawling ? 'animate-spin' : ''}`} />
                            <span>Crawl Target Site</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBulkModal(true)}
                            className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <UploadCloud className="w-3 h-3" />
                            <span>Import URLs</span>
                          </button>
                          <button
                            type="button"
                            onClick={onAutoPopulateRoutes}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Load Sample Routes</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No routes match your current filter. Try selecting "All Routes" or add a custom listing path below.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr 
                      key={page.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        page.includedInVisits ? 'text-slate-200' : 'text-slate-500 opacity-60'
                      }`}
                    >
                      {/* Inclusion checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={page.includedInVisits}
                          onChange={() => onTogglePageInclusion(page.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                        />
                      </td>

                      {/* Path & Title */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-300 font-semibold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[11px] truncate max-w-[280px]">
                            {page.path}
                          </span>
                          <span className="text-slate-200 font-medium truncate max-w-sm" title={page.title}>
                            {page.title}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-2.5 px-3">
                        {renderBadge(page)}
                      </td>

                      {/* Visit Probability Weight */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            disabled={!page.includedInVisits}
                            value={page.visitWeight}
                            onChange={(e) => onUpdatePageWeight(page.id, parseInt(e.target.value, 10))}
                            className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <span className="font-mono text-[11px] text-cyan-400 w-8">{page.visitWeight}%</span>
                        </div>
                      </td>

                      {/* Actions: Open in tab & Delete */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(() => {
                            const targetBase = (crawlState.targetUrl && crawlState.targetUrl.trim())
                              ? (crawlState.targetUrl.startsWith('http') ? crawlState.targetUrl.replace(/\/$/, '') : `https://${crawlState.targetUrl.replace(/\/$/, '')}`)
                              : 'https://9jajobs.vercel.app';
                            const fullUrl = (page.url && page.url.startsWith('http'))
                              ? page.url
                              : `${targetBase}${page.path.startsWith('/') ? page.path : `/${page.path}`}`;

                            return (
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                title={`Visit exact page: ${fullUrl}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            );
                          })()}

                          {page.path !== '/' && (
                            <button
                              type="button"
                              onClick={() => onRemovePage(page.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Remove Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Custom Listing / Route Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>Add Single Listing, Dynamic Job ID, or Custom Route:</span>
            <span className="text-[10px] text-slate-500">Supports full URL, ?job=ID, job_timestamp, or standard path</span>
          </div>

          <form onSubmit={handleAddPage} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="job_1787164089747 or https://jobs.eezor.com/?job=job_1787164089747"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
              />
            </div>
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Listing Title (e.g. Male Barbecue sales person is urgently needed)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customPath.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Listing</span>
            </button>
          </form>

          {/* Quick Insert Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick Add Samples:</span>
            <button
              type="button"
              onClick={() => {
                const { path, title } = parseListingInput('job_1787164089747', 'Male Barbecue sales person is urgently needed');
                onAddCustomPage(path, title);
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-mono transition-colors cursor-pointer"
            >
              + Barbecue Job (job_1787164089747)
            </button>
            <button
              type="button"
              onClick={() => {
                const { path, title } = parseListingInput('job_1785681865131', 'Urgent Solar Technician Lead');
                onAddCustomPage(path, title);
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-mono transition-colors cursor-pointer"
            >
              + Solar Tech (job_1785681865131)
            </button>
            <button
              type="button"
              onClick={() => {
                const { path, title } = parseListingInput('/category/software-web-development', 'Software & Web Development');
                onAddCustomPage(path, title);
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 font-mono transition-colors cursor-pointer"
            >
              + Category: Software & Web Dev
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-100">Bulk Import Listing URLs & IDs</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste one URL, query, or job ID per line (optionally with title separated by <code className="text-cyan-300 font-mono">|</code>), or paste raw copied job broadcasts directly.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleImportAllVerifiedListings}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load All 19+ Verified Listings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkInput(`/?job=job_1787164089747 | Male Barbecue sales person is urgently needed
/?job=job_1785681865131 | Urgent Commercial Solar & Inverter Installation Lead
/?job=job_1787164099999 | Senior Flutter & React Native Mobile App Engineer
/?job=job_105 | Full-Stack Next.js & Stripe/Paystack Engineer
/?job=job_101 | Mobile App Developer for Dispatch Rider Tracking System
/?article=art_101 | 10 Proven Tips to Ace High-Paying Job Interviews in Nigeria`);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors cursor-pointer"
              >
                Insert Sample IDs
              </button>
            </div>

            <textarea
              rows={6}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={`https://jobs.eezor.com/?job=job_1787164089747 | Male Barbecue sales person is urgently needed
job_1785681865131 | Urgent Commercial Solar Installation
https://jobs.eezor.com/?job=job_105 | Full-Stack Next.js Engineer
/category/software-web-development | Software & Web Dev
/about | About Us`}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 font-mono focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkInput.trim()}
                onClick={handleBulkImport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import All Listed Pages</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All URLs / Reset Crawler Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-slate-100">Clear Crawled URLs & Graph</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to clear the discovered URLs? Choose an option below:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Clear All Crawled URLs */}
              <button
                type="button"
                onClick={() => {
                  if (onClearAllPages) {
                    onClearAllPages();
                  } else {
                    crawlState.pages.forEach(p => onRemovePage(p.id));
                  }
                  setShowClearModal(false);
                  setFeedbackMessage('All crawled URLs and route graph cleared.');
                  setTimeout(() => setFeedbackMessage(null), 4000);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear All Crawled URLs ({crawlState.pages.length})</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                    Empty URLs
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Empties all {crawlState.pages.length} discovered routes from the crawler graph, while keeping your target domain configuration.
                </p>
              </button>

              {/* Option 2: Complete Reset */}
              {onResetCrawler && (
                <button
                  type="button"
                  onClick={() => {
                    onResetCrawler();
                    setShowClearModal(false);
                    setUrlInput('');
                    setFeedbackMessage('Site crawler and URL graph completely reset.');
                    setTimeout(() => setFeedbackMessage(null), 4000);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Complete Site Crawler & Target Reset</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      Full Reset
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Clears all URLs, target domain, detected GA tags, and cached scraper metadata back to a clean slate.
                  </p>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
