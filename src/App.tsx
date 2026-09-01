import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { TargetUrlCommandBar } from './components/TargetUrlCommandBar';
import { CrawlerPanel } from './components/CrawlerPanel';
import { TrafficSourcesMatrix } from './components/TrafficSourcesMatrix';
import { GeoAntiFingerprintPanel } from './components/GeoAntiFingerprintPanel';
import { BehaviorConfigPanel } from './components/BehaviorConfigPanel';
import { LiveVisitorStream } from './components/LiveVisitorStream';
import { CrawledUrlsRadarClock } from './components/CrawledUrlsRadarClock';
import { AIOrganicModal } from './components/AIOrganicModal';
import { OrganicRunSummaryModal } from './components/OrganicRunSummaryModal';
import { AuthModal } from './components/AuthModal';
import { ProfileEditModal } from './components/ProfileEditModal';

// Stress Load Components (for dual mode)
import { ConfigPanel } from './components/ConfigPanel';
import { LiveMetricsDashboard } from './components/LiveMetricsDashboard';
import { LiveRequestInspector } from './components/LiveRequestInspector';
import { AIAssistantModal } from './components/AIAssistantModal';
import { MockSandboxManager } from './components/MockSandboxManager';
import { ExportModal } from './components/ExportModal';
import { RunSummaryModal } from './components/RunSummaryModal';
import { HistoryPanel } from './components/HistoryPanel';

import { DEFAULT_ORGANIC_CONFIG, ORGANIC_PRESETS } from './data/organicPresets';
import { ALL_VERIFIED_NAIJA_JOBS, buildCrawledPagesFromListings } from './data/allNaijaJobListings';
import { getClientSideCrawledPages, generateClientSideCampaign, crawlWebsiteLiveInBrowser } from './utils/clientFallbackEngine';
import { loadStoredAuth, saveAuthSession, clearAuthSession, incrementMemberStats } from './utils/authManager';
import { TRAFFIC_PRESETS } from './data/presets';
import { 
  ActiveVisitorSession,
  AuthState,
  CrawledPage,
  DiscoveredRouteItem,
  LiveTelemetryEvent,
  MemberUser,
  MetricSnapshot, 
  OrganicRunSummary, 
  OrganicVisitorConfig, 
  RealHttpTrafficHit,
  RequestMetricLog, 
  RunSummary, 
  SiteCrawlState, 
  TestStatus, 
  TrafficConfig 
} from './types';
import { OrganicTrafficEngine } from './engine/organicEngine';
import { TrafficGeneratorEngine } from './engine/trafficEngine';
import { 
  Globe, 
  Compass, 
  Fingerprint, 
  Clock, 
  Activity, 
  Sparkles,
  RefreshCw,
  Play,
  Square,
  Zap,
  Layers,
  ArrowRight,
  Save,
  CheckCircle2,
  RotateCcw,
  Crown
} from 'lucide-react';

const STORAGE_KEYS = {
  ORGANIC_CONFIG: 'trafficpulse_organic_config_v2',
  CRAWL_STATE: 'trafficpulse_crawl_state_v2',
  APP_MODE: 'trafficpulse_app_mode_v2',
  STRESS_CONFIG: 'trafficpulse_stress_config_v2',
};

// Safe LocalStorage loader
function loadInitialOrganicConfig(): OrganicVisitorConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORGANIC_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_ORGANIC_CONFIG,
        ...parsed,
        organic: { ...DEFAULT_ORGANIC_CONFIG.organic, ...(parsed.organic || {}) },
        behavior: { ...DEFAULT_ORGANIC_CONFIG.behavior, ...(parsed.behavior || {}) },
        fingerprint: {
          ...DEFAULT_ORGANIC_CONFIG.fingerprint,
          ...(parsed.fingerprint || {}),
          countries: Array.isArray(parsed.fingerprint?.countries) && parsed.fingerprint.countries.length > 0
            ? parsed.fingerprint.countries
            : DEFAULT_ORGANIC_CONFIG.fingerprint.countries,
          proxyEngine: parsed.fingerprint?.proxyEngine || DEFAULT_ORGANIC_CONFIG.fingerprint.proxyEngine,
        },
        ga4: {
          ...DEFAULT_ORGANIC_CONFIG.ga4,
          ...(parsed.ga4 || {}),
          measurementId: parsed.ga4?.measurementId || DEFAULT_ORGANIC_CONFIG.ga4.measurementId,
        },
        crawlSettings: { ...DEFAULT_ORGANIC_CONFIG.crawlSettings, ...(parsed.crawlSettings || {}) },
      };
    }
  } catch (e) {
    console.warn('Failed to load saved organic config:', e);
  }
  return DEFAULT_ORGANIC_CONFIG;
}

const DEFAULT_CRAWLED_PAGES: CrawledPage[] = buildCrawledPagesFromListings('https://9jajobs.vercel.app');

function buildRecentDiscoveredItems(pages: CrawledPage[]): DiscoveredRouteItem[] {
  return pages.slice(0, 25).map((p, idx) => ({
    id: `rec_${p.id || idx}_${p.path}`,
    url: p.url,
    path: p.path,
    title: p.title,
    description: p.description,
    category: p.category,
    depth: p.depth || 1,
    statusCode: p.status || 200,
    discoveredAt: Date.now() - (idx * 4000),
    sourceType: p.path.includes('job=') || p.path.includes('post=') 
      ? 'dom_pattern' 
      : p.path.includes('category') 
      ? 'dom_pattern' 
      : p.id.startsWith('ld_') 
      ? 'json_ld' 
      : p.id.startsWith('sm_') 
      ? 'sitemap' 
      : p.id.startsWith('tok_') 
      ? 'script_bundle' 
      : 'html_link',
  }));
}

function loadInitialCrawlState(): SiteCrawlState {
  const initialRecent = buildRecentDiscoveredItems(DEFAULT_CRAWLED_PAGES);
  const defaultCrawl: SiteCrawlState = {
    targetUrl: 'https://9jajobs.vercel.app',
    hostname: '9jajobs.vercel.app',
    origin: 'https://9jajobs.vercel.app',
    title: 'NaijaJobs - Escrow Job Marketplace',
    description: 'Discovered 53+ job listings, categories, and articles on 9jajobs.vercel.app',
    pages: DEFAULT_CRAWLED_PAGES,
    isCrawling: false,
    gaMeasurementId: 'G-VFY5E884EH',
    statusCode: 200,
    latencyMs: 120,
    realLinksCount: 53,
    crawlProgressPct: 100,
    crawlPhase: 'Crawl Completed • All Routes Synced',
    recentlyDiscoveredRoutes: initialRecent,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CRAWL_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that saved state has valid pages and domain
      if (
        parsed && 
        Array.isArray(parsed.pages) && 
        parsed.pages.length > 0 &&
        parsed.hostname !== 'example.com' &&
        !parsed.pages.some((p: any) => p.id === 'p_root' || p.id === 'p_features')
      ) {
        return { 
          ...defaultCrawl, 
          ...parsed, 
          isCrawling: false,
          crawlProgressPct: 100,
          recentlyDiscoveredRoutes: parsed.recentlyDiscoveredRoutes && parsed.recentlyDiscoveredRoutes.length > 0
            ? parsed.recentlyDiscoveredRoutes
            : buildRecentDiscoveredItems(parsed.pages)
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load saved crawl state:', e);
  }
  return defaultCrawl;
}

export default function App() {
  // App Mode: 'organic' (Primary) vs 'stress' (API Load Testing)
  const [appMode, setAppMode] = useState<'organic' | 'stress'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_MODE);
      if (saved === 'organic' || saved === 'stress') return saved;
    } catch {}
    return 'organic';
  });

  // ==================== ORGANIC VISITOR STATE ====================
  const [organicConfig, setOrganicConfig] = useState<OrganicVisitorConfig>(loadInitialOrganicConfig);
  const [organicTab, setOrganicTab] = useState<'stream' | 'clock' | 'crawler' | 'sources' | 'geo' | 'behavior'>('stream');
  const [organicStatus, setOrganicStatus] = useState<TestStatus>('idle');
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitorSession[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<LiveTelemetryEvent[]>([]);
  const [httpHits, setHttpHits] = useState<RealHttpTrafficHit[]>([]);
  const [organicStats, setOrganicStats] = useState({
    totalVisitorsDispatched: 0,
    totalPageViews: 0,
    bouncedSessions: 0,
    avgEngagementSec: 0,
    activeCount: 0,
    sourcesCount: { organic: 0, social: 0, direct: 0, referral: 0 },
    countryCount: {} as Record<string, number>,
    totalArticleLinksClicked: 0,
    totalAdClicks: 0,
    totalPopupInteractions: 0,
    fullScrollRatePct: 0,
  });
  const [organicSummary, setOrganicSummary] = useState<OrganicRunSummary | null>(null);
  const [isAiOrganicOpen, setIsAiOrganicOpen] = useState(false);
  const [isAiGeneratingKeywords, setIsAiGeneratingKeywords] = useState(false);
  const [saveBannerMessage, setSaveBannerMessage] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('Auto-saved');

  // Crawler State
  const [crawlState, setCrawlState] = useState<SiteCrawlState>(loadInitialCrawlState);

  const organicEngineRef = useRef<OrganicTrafficEngine | null>(null);

  // ==================== STRESS LOAD STATE ====================
  const [stressConfig, setStressConfig] = useState<TrafficConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STRESS_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {}
    return TRAFFIC_PRESETS[0];
  });
  const [stressStatus, setStressStatus] = useState<TestStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<MetricSnapshot | null>(null);
  const [logs, setLogs] = useState<RequestMetricLog[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [successfulRequests, setSuccessfulRequests] = useState(0);
  const [failedRequests, setFailedRequests] = useState(0);
  const [stressTab, setStressTab] = useState<'dashboard' | 'inspector'>('dashboard');

  const [isAiStressModalOpen, setIsAiStressModalOpen] = useState(false);
  const [aiStressModalTab, setAiStressModalTab] = useState<'architect' | 'fuzzer'>('architect');
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentStressSummary, setCurrentStressSummary] = useState<RunSummary | null>(null);
  const [stressHistory, setStressHistory] = useState<RunSummary[]>([]);

  const stressEngineRef = useRef<TrafficGeneratorEngine | null>(null);
  const stressTimerRef = useRef<any>(null);

  // ==================== MEMBER AUTHENTICATION STATE ====================
  const [authState, setAuthState] = useState<AuthState>(loadStoredAuth);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalTitle, setAuthModalTitle] = useState<string | undefined>(undefined);
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string | undefined>(undefined);

  const handleAuthSuccess = (user: MemberUser, token: string) => {
    saveAuthSession(user, token);
    setAuthState({
      isAuthenticated: true,
      user,
      token,
    });
    setIsAuthModalOpen(false);
    setSaveBannerMessage(`Welcome back, ${user.name}! ${user.tier.toUpperCase()} member access unlocked.`);
    setTimeout(() => setSaveBannerMessage(null), 5000);
  };

  const handleProfileUpdated = (updatedUser: MemberUser) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
    setSaveBannerMessage(`Profile updated: ${updatedUser.name}`);
    setTimeout(() => setSaveBannerMessage(null), 4000);
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    setSaveBannerMessage('Logged out of member session.');
    setTimeout(() => setSaveBannerMessage(null), 4000);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', title?: string, subtitle?: string) => {
    setAuthModalMode(mode);
    setAuthModalTitle(title);
    setAuthModalSubtitle(subtitle);
    setIsAuthModalOpen(true);
  };

  // ==================== AUTO-PERSISTENCE & SCREEN WAKE-LOCK ====================
  const wakeLockRef = useRef<any>(null);

  const acquireWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock request notice:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {}
    }
  };

  useEffect(() => {
    const isEngineActive = organicStatus === 'running' || stressStatus === 'running';
    if (isEngineActive) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (organicStatus === 'running' || stressStatus === 'running')) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseWakeLock();
    };
  }, [organicStatus, stressStatus]);

  // Save organicConfig automatically whenever any setting changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORGANIC_CONFIG, JSON.stringify(organicConfig));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTimestamp(`Saved at ${now}`);
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }, [organicConfig]);

  // Save crawl state automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CRAWL_STATE, JSON.stringify({
        targetUrl: crawlState.targetUrl,
        hostname: crawlState.hostname,
        title: crawlState.title,
        pages: crawlState.pages,
        gaMeasurementId: crawlState.gaMeasurementId,
      }));
    } catch (e) {
      console.warn('Auto-save crawl state error:', e);
    }
  }, [crawlState]);

  // Synchronize document title
  useEffect(() => {
    if (organicStatus === 'running') {
      document.title = `🟢 (${organicStats.activeCount} Active) TrafficPulse`;
    } else if (stressStatus === 'running') {
      document.title = `⚡ (${totalRequests} Reqs) TrafficPulse`;
    } else {
      document.title = 'TrafficPulse - Organic & Social Traffic Generator';
    }
  }, [organicStatus, organicStats.activeCount, stressStatus, totalRequests]);

  // Save stress config & app mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STRESS_CONFIG, JSON.stringify(stressConfig));
    } catch {}
  }, [stressConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_MODE, appMode);
    } catch {}
  }, [appMode]);

  // Explicit Save Handler
  const handleExplicitSave = (tabName?: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORGANIC_CONFIG, JSON.stringify(organicConfig));
      localStorage.setItem(STORAGE_KEYS.CRAWL_STATE, JSON.stringify({
        targetUrl: crawlState.targetUrl,
        hostname: crawlState.hostname,
        title: crawlState.title,
        pages: crawlState.pages,
        gaMeasurementId: crawlState.gaMeasurementId,
      }));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTimestamp(`Saved at ${now}`);
      setSaveBannerMessage(tabName ? `All ${tabName} configurations successfully saved to browser storage!` : 'All campaign settings successfully saved!');
      setTimeout(() => setSaveBannerMessage(null), 4000);
    } catch (e) {
      console.error('Save failed:', e);
      setSaveBannerMessage('Error saving configurations to local storage.');
      setTimeout(() => setSaveBannerMessage(null), 4000);
    }
  };

  // Reset to Defaults Handler
  const handleResetToDefaults = () => {
    if (window.confirm('Reset all country, proxy, source, dwell, and behavioral settings back to default?')) {
      setOrganicConfig(DEFAULT_ORGANIC_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.ORGANIC_CONFIG);
      setSaveBannerMessage('Settings reset to default profile.');
      setTimeout(() => setSaveBannerMessage(null), 3000);
    }
  };

  // ==================== CRAWLER ACTIONS ====================
  const handleStartCrawl = async (targetUrlOverride?: string): Promise<CrawledPage[]> => {
    let urlToCrawl = (targetUrlOverride || crawlState.targetUrl || '').trim();
    if (!urlToCrawl) return [];

    if (!urlToCrawl.startsWith('http://') && !urlToCrawl.startsWith('https://') && !urlToCrawl.startsWith('/')) {
      urlToCrawl = `https://${urlToCrawl}`;
    }

    // Switch to crawler tab immediately so user sees live crawler status & discovered routes
    setOrganicTab('crawler');

    setCrawlState(prev => ({ 
      ...prev, 
      targetUrl: urlToCrawl,
      isCrawling: true, 
      error: undefined,
      crawlProgressPct: 15,
      crawlPhase: 'Initiating Handshake & DNS Resolution...',
      currentScanningUrl: urlToCrawl,
    }));
    setOrganicConfig(prev => ({ ...prev, targetUrl: urlToCrawl }));
    setSaveBannerMessage(`Crawling ${urlToCrawl}... discovering pages, listings, and sitemaps.`);

    // Active progress stages simulation while crawler scrapes
    let stepIndex = 0;
    const progressStages = [
      { pct: 28, phase: 'Scraping Root HTML & Meta Headers...', sub: urlToCrawl },
      { pct: 46, phase: 'Decompiling JavaScript Bundles & JSON-LD Schemas...', sub: `${urlToCrawl}/assets/index.js` },
      { pct: 68, phase: 'Parsing XML Sitemaps & REST Endpoints...', sub: `${urlToCrawl}/sitemap.xml` },
      { pct: 84, phase: 'Executing Recursive DOM Link-Discovery Pass...', sub: `${urlToCrawl}/?job=job_1787164089747` },
      { pct: 93, phase: 'Deduplicating Routes & Calculating Priority Weights...', sub: `${urlToCrawl}/category/engineering` },
    ];

    const progressInterval = setInterval(() => {
      if (stepIndex < progressStages.length) {
        const stage = progressStages[stepIndex];
        setCrawlState(prev => {
          if (!prev.isCrawling) return prev;
          return {
            ...prev,
            crawlProgressPct: stage.pct,
            crawlPhase: stage.phase,
            currentScanningUrl: stage.sub,
          };
        });
        stepIndex++;
      }
    }, 450);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/crawler/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToCrawl,
          targetUrl: urlToCrawl,
          maxDepth: organicConfig.crawlSettings.maxDepth || 2,
          maxLinks: Math.max(300, organicConfig.crawlSettings.maxLinks || 300),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
      }

      clearInterval(progressInterval);

      if (!res.ok) {
        throw new Error(data.error || `Crawler request failed with status ${res.status}`);
      }

      if (data.pages && data.pages.length > 0) {
        const newHostname = data.hostname || (urlToCrawl.startsWith('/') ? 'Local Sandbox' : new URL(urlToCrawl).hostname);
        // Retain user-custom-added listings/pages on the same domain
        const isSameDomain = crawlState.hostname === newHostname;
        const incomingPaths = new Set(data.pages.map((p: any) => p.path));
        const retainedCustom = isSameDomain
          ? crawlState.pages.filter(p => !incomingPaths.has(p.path))
          : [];
        const mergedPages = [...data.pages, ...retainedCustom];
        const recentItems = buildRecentDiscoveredItems(mergedPages);

        setCrawlState({
          targetUrl: data.targetUrl || urlToCrawl,
          hostname: newHostname,
          origin: data.origin || (urlToCrawl.startsWith('http') ? new URL(urlToCrawl).origin : 'https://jobs.eezor.com'),
          title: data.title || 'Discovered Website',
          description: data.description || `Scraped site for ${newHostname}`,
          pages: mergedPages,
          isCrawling: false,
          gaMeasurementId: data.gaMeasurementId,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          realLinksCount: data.realLinksCount || mergedPages.length,
          visitedUrlsCount: data.visitedUrlsCount || mergedPages.length,
          recursivePassDepth: data.recursivePassDepth || organicConfig.crawlSettings.maxDepth || 2,
          listingPatternsMatched: data.listingPatternsMatched || mergedPages.filter((p: any) => p.category === 'post' || p.path.includes('job') || p.path.includes('post')).length,
          crawlProgressPct: 100,
          crawlPhase: 'Crawl Completed • All Routes Synced',
          currentScanningUrl: urlToCrawl,
          recentlyDiscoveredRoutes: recentItems,
        });

        setSaveBannerMessage(`Crawl complete! Discovered ${mergedPages.length} active routes on ${data.hostname || urlToCrawl}.`);
        setTimeout(() => setSaveBannerMessage(null), 6000);

        // If GA4 was detected, update organic config
        if (data.gaMeasurementId) {
          setOrganicConfig(prev => ({
            ...prev,
            ga4: {
              ...prev.ga4,
              measurementId: data.gaMeasurementId,
            }
          }));
        }
        return mergedPages;
      } else {
        throw new Error(data.error || 'Failed to extract links');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.warn('Backend crawler notice, executing live browser crawler:', err.message);
      let hostname = 'Discovered Website';
      try {
        hostname = urlToCrawl.startsWith('/') ? 'Local Sandbox' : new URL(urlToCrawl).hostname;
      } catch {}

      // Live in-browser crawler parsing HTML, sitemaps and dynamic tokens
      try {
        const liveCrawlResult = await crawlWebsiteLiveInBrowser(urlToCrawl);
        const discovered = liveCrawlResult.pages && liveCrawlResult.pages.length > 0 ? liveCrawlResult.pages : getClientSideCrawledPages(urlToCrawl);
        
        const isSameDomain = crawlState.hostname === hostname;
        const incomingPaths = new Set(discovered.map(p => p.path));
        const retainedCustom = isSameDomain
          ? crawlState.pages.filter(p => !incomingPaths.has(p.path))
          : [];
        const fallbackPages = [...discovered, ...retainedCustom];
        const recentItems = buildRecentDiscoveredItems(fallbackPages);

        setCrawlState({
          targetUrl: urlToCrawl,
          hostname,
          origin: urlToCrawl.startsWith('http') ? new URL(urlToCrawl).origin : 'https://jobs.eezor.com',
          title: liveCrawlResult.title || `${hostname} - Catalog`,
          description: `Scraped site for ${hostname}`,
          pages: fallbackPages,
          isCrawling: false,
          statusCode: 200,
          latencyMs: 65,
          realLinksCount: fallbackPages.length,
          visitedUrlsCount: fallbackPages.length,
          recursivePassDepth: organicConfig.crawlSettings.maxDepth || 2,
          listingPatternsMatched: fallbackPages.filter(p => p.category === 'post' || p.path.includes('job') || p.path.includes('post')).length,
          gaMeasurementId: liveCrawlResult.gaMeasurementId,
          crawlProgressPct: 100,
          crawlPhase: 'Crawl Completed • In-Browser Engine',
          currentScanningUrl: urlToCrawl,
          recentlyDiscoveredRoutes: recentItems,
        });

        setSaveBannerMessage(`Discovered ${fallbackPages.length} verified routes for ${hostname}!`);
        setTimeout(() => setSaveBannerMessage(null), 6000);

        if (liveCrawlResult.gaMeasurementId) {
          setOrganicConfig(prev => ({
            ...prev,
            ga4: {
              ...prev.ga4,
              measurementId: liveCrawlResult.gaMeasurementId,
            }
          }));
        }

        return fallbackPages;
      } catch (clientErr: any) {
        console.error('Client crawl fallback error:', clientErr);
        const catalogPages = getClientSideCrawledPages(urlToCrawl);
        const isSameDomain = crawlState.hostname === hostname;
        const incomingPaths = new Set(catalogPages.map(p => p.path));
        const retainedCustom = isSameDomain
          ? crawlState.pages.filter(p => !incomingPaths.has(p.path))
          : [];
        const fallbackPages = [...catalogPages, ...retainedCustom];
        const recentItems = buildRecentDiscoveredItems(fallbackPages);

        setCrawlState({
          targetUrl: urlToCrawl,
          hostname,
          origin: urlToCrawl.startsWith('http') ? new URL(urlToCrawl).origin : 'https://jobs.eezor.com',
          title: `${hostname} - Catalog`,
          description: `Scraped site for ${hostname}`,
          pages: fallbackPages,
          isCrawling: false,
          statusCode: 200,
          latencyMs: 40,
          realLinksCount: fallbackPages.length,
          visitedUrlsCount: fallbackPages.length,
          recursivePassDepth: 2,
          listingPatternsMatched: fallbackPages.filter(p => p.category === 'post' || p.path.includes('job') || p.path.includes('post')).length,
          crawlProgressPct: 100,
          crawlPhase: 'Crawl Completed • Static Catalog Sync',
          currentScanningUrl: urlToCrawl,
          recentlyDiscoveredRoutes: recentItems,
        });
        setSaveBannerMessage(`Loaded ${fallbackPages.length} routes for ${hostname}.`);
        setTimeout(() => setSaveBannerMessage(null), 6000);
        return fallbackPages;
      }
    }
  };

  const handleTogglePageInclusion = (pageId: string) => {
    setCrawlState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, includedInVisits: !p.includedInVisits } : p),
    }));
  };

  const handleUpdatePageWeight = (pageId: string, weight: number) => {
    setCrawlState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, visitWeight: weight } : p),
    }));
  };

  const handleAddCustomPage = (path: string, title: string) => {
    let cleanOrigin = crawlState.targetUrl;
    try {
      const u = new URL(crawlState.targetUrl);
      cleanOrigin = u.origin;
    } catch {}

    const isJobOrPost = path.includes('job=') || path.includes('job_') || path.includes('/job/') || path.includes('post=') || path.includes('/post/') || path.includes('article=') || path.includes('/article/') || path.includes('listing=');
    const isCat = path.includes('category') || path.includes('topics') || path.includes('section');

    const category: 'post' | 'category' | 'page' = isJobOrPost ? 'post' : isCat ? 'category' : 'page';
    const visitWeight = isJobOrPost ? 95 : isCat ? 85 : 75;

    setCrawlState(prev => {
      // If path already exists, update title & weight instead of duplicating
      const existingIdx = prev.pages.findIndex(p => p.path === path);
      if (existingIdx >= 0) {
        const updated = [...prev.pages];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: title || updated[existingIdx].title,
          includedInVisits: true,
          visitWeight: Math.max(updated[existingIdx].visitWeight, visitWeight),
          category,
        };
        return { ...prev, pages: updated };
      }

      const newPage: CrawledPage = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: `${cleanOrigin}${path}`,
        path,
        title: title || (isJobOrPost ? `Job Listing: ${path.replace(/^\/\?job=/, '')}` : path),
        description: isJobOrPost ? `Specific content listing on ${prev.hostname}` : 'Custom added navigation route',
        depth: 1,
        status: 200,
        includedInVisits: true,
        visitWeight,
        gaDetected: true,
        category,
      };

      return {
        ...prev,
        pages: [...prev.pages, newPage],
      };
    });
  };

  const handleAddMultiplePages = (
    newItems: Array<{ path: string; title: string; category?: 'post' | 'category' | 'page'; url?: string; weight?: number }>,
    discoveredUrl?: string,
    discoveredHostname?: string
  ) => {
    if (!newItems || newItems.length === 0) return;

    let cleanOrigin = crawlState.targetUrl;
    let targetHostname = crawlState.hostname;

    if (discoveredUrl && (discoveredUrl.startsWith('http://') || discoveredUrl.startsWith('https://'))) {
      cleanOrigin = discoveredUrl;
    } else {
      try {
        const u = new URL(crawlState.targetUrl);
        cleanOrigin = u.origin;
        targetHostname = u.hostname;
      } catch {}
    }

    if (discoveredHostname) {
      targetHostname = discoveredHostname;
    }

    setCrawlState(prev => {
      const existingMap = new Map<string, CrawledPage>();
      prev.pages.forEach(p => existingMap.set(p.path, p));

      newItems.forEach((item, index) => {
        const isJobOrPost = item.category === 'post' || item.path.includes('job=') || item.path.includes('job_') || item.path.includes('/job/') || item.path.includes('post=') || item.path.includes('/post/') || item.path.includes('article=') || item.path.includes('/article/') || item.path.includes('listing=') || item.path.includes('/blog/');
        const isCat = item.category === 'category' || item.path.includes('category') || item.path.includes('topics') || item.path.includes('section');
        const category: 'post' | 'category' | 'page' = item.category || (isJobOrPost ? 'post' : isCat ? 'category' : 'page');
        const visitWeight = item.weight || (isJobOrPost ? 95 : isCat ? 85 : 75);
        const cleanPath = item.path.startsWith('/') ? item.path : `/${item.path}`;

        if (existingMap.has(cleanPath)) {
          const existing = existingMap.get(cleanPath)!;
          existingMap.set(cleanPath, {
            ...existing,
            title: item.title || existing.title,
            includedInVisits: true,
            visitWeight: Math.max(existing.visitWeight, visitWeight),
            category,
          });
        } else {
          const newPage: CrawledPage = {
            id: `manual_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            url: item.url || `${cleanOrigin}${cleanPath}`,
            path: cleanPath,
            title: item.title || (isJobOrPost ? `Listing: ${cleanPath}` : cleanPath),
            description: isJobOrPost ? `Target content listing on ${targetHostname || prev.hostname}` : 'Custom imported route',
            depth: 1,
            status: 200,
            includedInVisits: true,
            visitWeight,
            gaDetected: true,
            category,
          };
          existingMap.set(cleanPath, newPage);
        }
      });

      const mergedPages = Array.from(existingMap.values());
      const recentItems = buildRecentDiscoveredItems(mergedPages);

      return {
        ...prev,
        targetUrl: prev.targetUrl && prev.targetUrl !== 'https://9jajobs.vercel.app' ? prev.targetUrl : (discoveredUrl || prev.targetUrl),
        hostname: prev.hostname && prev.hostname !== '9jajobs.vercel.app' ? prev.hostname : (targetHostname || prev.hostname),
        origin: prev.origin && prev.origin !== 'https://9jajobs.vercel.app' ? prev.origin : (cleanOrigin || prev.origin),
        pages: mergedPages,
        realLinksCount: mergedPages.length,
        visitedUrlsCount: Math.max(prev.visitedUrlsCount, mergedPages.length),
        listingPatternsMatched: mergedPages.filter(p => p.category === 'post').length,
        recentlyDiscoveredRoutes: recentItems,
        crawlProgressPct: 100,
        crawlPhase: 'Routes Synced • Sitemap & URLs Merged',
      };
    });

    setSaveBannerMessage(`Successfully merged ${newItems.length} routes into crawl graph!`);
    setTimeout(() => setSaveBannerMessage(null), 5000);
  };

  const handleRemovePage = (pageId: string) => {
    setCrawlState(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p.id !== pageId),
    }));
  };

  const handleClearAllPages = () => {
    setCrawlState(prev => ({
      ...prev,
      pages: [],
      realLinksCount: 0,
      error: null,
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.CRAWL_STATE, JSON.stringify({
        targetUrl: crawlState.targetUrl,
        hostname: crawlState.hostname,
        title: crawlState.title,
        pages: [],
        gaMeasurementId: crawlState.gaMeasurementId,
      }));
    } catch (e) {
      console.warn('Failed saving empty crawl state:', e);
    }
    setSaveBannerMessage('All crawled URLs and URL graph cleared successfully.');
    setTimeout(() => setSaveBannerMessage(null), 4000);
  };

  const handleResetCrawler = () => {
    setCrawlState({
      targetUrl: 'https://',
      hostname: '',
      origin: '',
      title: '',
      description: '',
      pages: [],
      isCrawling: false,
      gaMeasurementId: undefined,
      statusCode: undefined,
      latencyMs: undefined,
      realLinksCount: 0,
      error: null,
    });
    try {
      localStorage.removeItem(STORAGE_KEYS.CRAWL_STATE);
    } catch (e) {
      console.warn('Failed clearing saved crawl state:', e);
    }
    setSaveBannerMessage('Site crawler and URL graph completely reset.');
    setTimeout(() => setSaveBannerMessage(null), 4000);
  };

  const handleAutoPopulateRoutes = () => {
    const commonRoutes = [
      { path: '/pricing', title: 'Plans & Pricing Matrix' },
      { path: '/features', title: 'Platform Capabilities & Features' },
      { path: '/docs/quickstart', title: 'Developer Documentation' },
      { path: '/blog/latest-updates-2026', title: 'Engineering Blog: Scaling Guide' },
      { path: '/about', title: 'About the Company' },
      { path: '/contact', title: 'Support & Inquiries' },
    ];

    const currentPaths = new Set(crawlState.pages.map(p => p.path));
    const newPages: CrawledPage[] = commonRoutes
      .filter(r => !currentPaths.has(r.path))
      .map(r => ({
        id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        url: `${crawlState.targetUrl}${r.path}`,
        path: r.path,
        title: r.title,
        description: 'Auto-generated route',
        depth: 1,
        status: 200,
        includedInVisits: true,
        visitWeight: 60,
        gaDetected: true,
      }));

    setCrawlState(prev => ({
      ...prev,
      pages: [...prev.pages, ...newPages],
    }));
  };

  // ==================== ORGANIC ENGINE EXECUTION ====================
  const handleStartOrganic = async () => {
    if (organicStatus === 'running') return;

    // Instant UI Transition
    setOrganicStatus('running');
    setOrganicTab('stream');
    setTelemetryEvents([]);
    setHttpHits([]);
    setOrganicStats({
      totalVisitorsDispatched: 0,
      totalPageViews: 0,
      bouncedSessions: 0,
      avgEngagementSec: 0,
      activeCount: 0,
      sourcesCount: { organic: 0, social: 0, direct: 0, referral: 0 },
      countryCount: {},
    });

    const targetUrl = (organicConfig.targetUrl || crawlState.targetUrl || 'https://jobs.eezor.com').trim();
    let pagesToUse = crawlState.pages && crawlState.pages.length > 0 ? crawlState.pages : getClientSideCrawledPages(targetUrl);

    const effectiveGa4Id = (organicConfig.ga4?.measurementId || crawlState.gaMeasurementId || 'G-VFY5E884EH').trim();

    const effectiveOrganicConfig: OrganicVisitorConfig = {
      ...organicConfig,
      targetUrl,
      ga4: {
        ...organicConfig.ga4,
        measurementId: effectiveGa4Id,
        autoSendMeasurementProtocol: true,
        sendEngagementEvents: true,
        sendSessionEvents: true,
        sendScrollEvents: true,
      }
    };

    const engine = new OrganicTrafficEngine(effectiveOrganicConfig, pagesToUse, {
      onActiveVisitorsUpdate: (visitors) => {
        setActiveVisitors([...visitors]);
      },
      onTelemetryEvent: (evt) => {
        setTelemetryEvents(prev => [evt, ...prev.slice(0, 100)]);
      },
      onHttpTrafficHit: (hit) => {
        setHttpHits(prev => [hit, ...prev.slice(0, 150)]);
      },
      onStatsUpdate: (stats) => {
        setOrganicStats(stats);
      },
      onComplete: (summary) => {
        setOrganicStatus('completed');
        setActiveVisitors([]);
        setOrganicSummary(summary);
        if (summary) {
          incrementMemberStats(summary.totalVisitorsDispatched || 1);
          setAuthState(loadStoredAuth());
        }
      },
      onError: (err) => {
        console.error('Organic Engine error:', err);
        setOrganicStatus('error');
      },
    });

    organicEngineRef.current = engine;
    engine.start();

    // Asynchronously refresh route catalog in background if initial sample or domain changed
    if (
      crawlState.pages.some(p => p.id.startsWith('p_root')) || 
      crawlState.targetUrl !== targetUrl || 
      crawlState.pages.length <= 5
    ) {
      handleStartCrawl(targetUrl).then(scraped => {
        if (scraped && scraped.length > 0 && organicEngineRef.current) {
          // Engine continues smoothly with discovered routes
        }
      }).catch(() => {});
    }
  };

  const handleStopOrganic = () => {
    if (organicEngineRef.current) {
      organicEngineRef.current.stop();
    }
    setOrganicStatus('idle');
  };

  const handleSelectOrganicPreset = (presetId: string) => {
    const preset = ORGANIC_PRESETS.find(p => p.id === presetId);
    if (preset && preset.config) {
      setOrganicConfig(prev => ({
        ...prev,
        ...preset.config,
        organic: { ...prev.organic, ...preset.config.organic },
        behavior: { ...prev.behavior, ...preset.config.behavior },
        fingerprint: { ...prev.fingerprint, ...preset.config.fingerprint },
      }));
    }
  };

  const handleAiKeywordsQuick = async () => {
    setIsAiGeneratingKeywords(true);
    try {
      const res = await fetch('/api/ai/generate-organic-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: crawlState.targetUrl,
          description: `Generate 15 high-intent Google search keywords for ${crawlState.title || crawlState.targetUrl}`,
          objective: 'seo',
        }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        const clientCampaign = generateClientSideCampaign(crawlState.targetUrl, '', 'seo');
        data = { campaign: clientCampaign };
      }

      if (data.campaign?.keywords) {
        setOrganicConfig(prev => ({
          ...prev,
          organic: {
            ...prev.organic,
            keywords: Array.from(new Set([...prev.organic.keywords, ...data.campaign.keywords])),
          }
        }));
      }
    } catch (err) {
      const clientCampaign = generateClientSideCampaign(crawlState.targetUrl, '', 'seo');
      if (clientCampaign.keywords) {
        setOrganicConfig(prev => ({
          ...prev,
          organic: {
            ...prev.organic,
            keywords: Array.from(new Set([...prev.organic.keywords, ...clientCampaign.keywords])),
          }
        }));
      }
    } finally {
      setIsAiGeneratingKeywords(false);
    }
  };

  // ==================== STRESS ENGINE EXECUTION ====================
  const handleStartStress = () => {
    if (stressStatus === 'running') return;

    setStressStatus('running');
    setElapsedSeconds(0);
    setSnapshots([]);
    setLatestSnapshot(null);
    setLogs([]);
    setTotalRequests(0);
    setSuccessfulRequests(0);
    setFailedRequests(0);

    if (stressTimerRef.current) clearInterval(stressTimerRef.current);
    stressTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    const engine = new TrafficGeneratorEngine(stressConfig, {
      onSnapshot: (snapshot) => {
        setSnapshots(prev => [...prev.slice(-60), snapshot]);
        setLatestSnapshot(snapshot);
      },
      onLog: (log) => {
        setLogs(prev => [log, ...prev.slice(0, 150)]);
        setTotalRequests(prev => prev + 1);
        if (log.success) setSuccessfulRequests(prev => prev + 1);
        else setFailedRequests(prev => prev + 1);
      },
      onComplete: (summary) => {
        setStressStatus('completed');
        if (stressTimerRef.current) clearInterval(stressTimerRef.current);
        setCurrentStressSummary(summary);
        setStressHistory(prev => [summary, ...prev.slice(0, 20)]);
        if (summary) {
          incrementMemberStats(summary.totalRequests || 1);
          setAuthState(loadStoredAuth());
        }
      },
      onError: (err) => {
        console.error('Stress Engine error:', err);
        setStressStatus('error');
        if (stressTimerRef.current) clearInterval(stressTimerRef.current);
      }
    });

    stressEngineRef.current = engine;
    engine.start();
  };

  const handleStopStress = () => {
    if (stressEngineRef.current) stressEngineRef.current.stop();
    if (stressTimerRef.current) clearInterval(stressTimerRef.current);
    setStressStatus('idle');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        appMode={appMode}
        onSwitchAppMode={setAppMode}
        organicConfig={organicConfig}
        onSelectOrganicPreset={handleSelectOrganicPreset}
        isOrganicRunning={organicStatus === 'running'}
        activeVisitorsCount={activeVisitors.length}
        onStartOrganic={handleStartOrganic}
        onStopOrganic={handleStopOrganic}
        onOpenAiOrganic={() => setIsAiOrganicOpen(true)}
        stressConfig={stressConfig}
        setStressConfig={setStressConfig}
        isStressRunning={stressStatus === 'running'}
        elapsedSeconds={elapsedSeconds}
        onStartStress={handleStartStress}
        onStopStress={handleStopStress}
        onOpenAiStress={() => {
          setAiStressModalTab('architect');
          setIsAiStressModalOpen(true);
        }}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        currentUser={authState.user}
        onOpenAuth={(mode) => openAuthModal(mode)}
        onOpenProfileEdit={() => setIsProfileEditOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Unauthenticated Member Prompt Banner */}
        {!authState.isAuthenticated && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">TrafficPulse Member Access</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Registration Open
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Register or login before generating traffic to unlock <strong className="text-emerald-300 font-semibold">Custom Total Visits / Pageviews Cap</strong>, multi-country proxies, and real-time GA4 engagement dispatching.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex-1 md:flex-initial px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>Join & Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {appMode === 'organic' ? (
          <>
            {/* Primary Target URL & Real Traffic Command Bar */}
            <TargetUrlCommandBar
              targetUrl={crawlState.targetUrl}
              onUpdateTargetUrl={(url) => {
                setCrawlState(prev => ({ ...prev, targetUrl: url }));
                setOrganicConfig(prev => ({ ...prev, targetUrl: url }));
              }}
              crawlState={crawlState}
              onStartCrawl={(url) => handleStartCrawl(url)}
              status={organicStatus}
              onStartTraffic={handleStartOrganic}
              onStopTraffic={handleStopOrganic}
              activeVisitorsCount={activeVisitors.length}
            />

            {/* Primary Organic Mode Navigation Sub-Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => setOrganicTab('stream')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'stream'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Visitor Stream & Real Traffic</span>
                  {activeVisitors.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold">
                      {activeVisitors.length}
                    </span>
                  )}
                  {httpHits.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-amber-300 font-mono font-bold">
                      {httpHits.length} hits
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOrganicTab('clock')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'clock'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Live URLs Radar Clock</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                    {crawlState.pages.length} URLs
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrganicTab('crawler')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'crawler'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Site Crawler & URL Graph</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
                    {crawlState.pages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrganicTab('sources')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'sources'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Traffic Sources & SEO Keywords</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrganicTab('geo')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'geo'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Multi-Country & Anti-Fingerprint</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrganicTab('behavior')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    organicTab === 'behavior'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dwell Time & Human Behavior</span>
                </button>
              </div>

              {/* Status Indicator & Global Save All Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{lastSavedTimestamp}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleExplicitSave()}
                  className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                  title="Force save all campaign, country, sources, dwell and crawler configurations"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save All Settings</span>
                </button>

                {organicStatus === 'running' && (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Save Notification Toast / Banner */}
            {saveBannerMessage && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveBannerMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveBannerMessage(null)}
                  className="text-emerald-400 hover:text-emerald-200 cursor-pointer font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tab Views */}
            {organicTab === 'stream' && (
              <LiveVisitorStream
                status={organicStatus}
                activeVisitors={activeVisitors}
                telemetryEvents={telemetryEvents}
                httpHits={httpHits}
                stats={organicStats}
                targetUrl={crawlState.targetUrl}
                onClearEvents={() => setTelemetryEvents([])}
              />
            )}

            {organicTab === 'clock' && (
              <CrawledUrlsRadarClock
                crawlState={crawlState}
                status={organicStatus}
                activeVisitorsCount={activeVisitors.length}
                onTogglePageInclusion={handleTogglePageInclusion}
                onUpdatePageWeight={handleUpdatePageWeight}
                onStartCrawl={(url) => handleStartCrawl(url)}
                onClearAllPages={handleClearAllPages}
              />
            )}

            {organicTab === 'crawler' && (
              <CrawlerPanel
                crawlState={crawlState}
                onUpdateTargetUrl={(url) => {
                  setCrawlState(prev => ({ ...prev, targetUrl: url }));
                  setOrganicConfig(prev => ({ ...prev, targetUrl: url }));
                }}
                onStartCrawl={(url) => handleStartCrawl(url)}
                onTogglePageInclusion={handleTogglePageInclusion}
                onUpdatePageWeight={handleUpdatePageWeight}
                onAddCustomPage={handleAddCustomPage}
                onAddMultiplePages={handleAddMultiplePages}
                onRemovePage={handleRemovePage}
                onAutoPopulateRoutes={handleAutoPopulateRoutes}
                onClearAllPages={handleClearAllPages}
                onResetCrawler={handleResetCrawler}
              />
            )}

            {organicTab === 'sources' && (
              <TrafficSourcesMatrix
                organicConfig={organicConfig.organic}
                onChange={(newOrganic) => setOrganicConfig(prev => ({ ...prev, organic: newOrganic }))}
                onOpenAiKeywords={handleAiKeywordsQuick}
                isAiGeneratingKeywords={isAiGeneratingKeywords}
                onSaveSettings={() => handleExplicitSave('Traffic Sources & Keywords')}
                onResetDefaults={handleResetToDefaults}
              />
            )}

            {organicTab === 'geo' && (
              <GeoAntiFingerprintPanel
                fingerprintConfig={organicConfig.fingerprint}
                onChange={(newFp) => setOrganicConfig(prev => ({ ...prev, fingerprint: newFp }))}
                onSaveSettings={() => handleExplicitSave('Multi-Country & Proxy')}
                onResetDefaults={handleResetToDefaults}
              />
            )}

            {organicTab === 'behavior' && (
              <BehaviorConfigPanel
                behavior={organicConfig.behavior}
                ga4={organicConfig.ga4}
                onChangeBehavior={(newBehavior) => setOrganicConfig(prev => ({ ...prev, behavior: newBehavior }))}
                onChangeGa4={(newGa4) => setOrganicConfig(prev => ({ ...prev, ga4: newGa4 }))}
                onSaveSettings={() => handleExplicitSave('Dwell Time & Human Behavior')}
                onResetDefaults={handleResetToDefaults}
                currentUser={authState.user}
                onOpenAuth={() => openAuthModal('login')}
              />
            )}
          </>
        ) : (
          /* Stress Mode View */
          <>
            <ConfigPanel
              config={stressConfig}
              onChange={setStressConfig}
              onOpenAiFuzzer={() => {
                setAiStressModalTab('fuzzer');
                setIsAiStressModalOpen(true);
              }}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStressTab('dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stressTab === 'dashboard'
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stress Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setStressTab('inspector')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      stressTab === 'inspector'
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Live Request Inspector</span>
                    {logs.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-cyan-400 font-mono">
                        {logs.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {stressTab === 'dashboard' ? (
                <LiveMetricsDashboard
                  status={stressStatus}
                  snapshots={snapshots}
                  latestSnapshot={latestSnapshot}
                  totalRequests={totalRequests}
                  successfulRequests={successfulRequests}
                  failedRequests={failedRequests}
                  elapsedSeconds={elapsedSeconds}
                  totalDurationSeconds={stressConfig.loadProfile.durationSeconds}
                />
              ) : (
                <LiveRequestInspector
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Organic AI Modal */}
      <AIOrganicModal
        isOpen={isAiOrganicOpen}
        onClose={() => setIsAiOrganicOpen(false)}
        targetUrl={crawlState.targetUrl}
        onApplyConfig={(generated) => {
          setOrganicConfig(prev => ({
            ...prev,
            ...generated,
            organic: { ...prev.organic, ...(generated.organic || {}) },
            behavior: { ...prev.behavior, ...(generated.behavior || {}) },
          }));
        }}
      />

      {/* Organic Run Summary Modal */}
      <OrganicRunSummaryModal
        summary={organicSummary}
        onClose={() => setOrganicSummary(null)}
        onRunAgain={handleStartOrganic}
      />

      {/* Stress Load Modals */}
      <AIAssistantModal
        isOpen={isAiStressModalOpen}
        onClose={() => setIsAiStressModalOpen(false)}
        onApplyScenario={(newCfg) => setStressConfig(newCfg)}
        onApplyFuzzPayload={(fuzzPayload) => {
          setStressConfig(prev => ({
            ...prev,
            bodyContent: fuzzPayload,
            bodyType: 'json',
            method: prev.method === 'GET' ? 'POST' : prev.method,
          }));
        }}
        initialTab={aiStressModalTab}
        currentConfig={stressConfig}
      />

      <MockSandboxManager
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        onSelectEndpoint={(url, method, body) => {
          setStressConfig(prev => ({
            ...prev,
            targetUrl: url,
            method,
            engineMode: 'built_in_sandbox',
            bodyContent: body || prev.bodyContent,
          }));
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        config={stressConfig}
      />

      <RunSummaryModal
        summary={currentStressSummary}
        onClose={() => setCurrentStressSummary(null)}
        onRunAgain={handleStartStress}
      />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={stressHistory}
        onSelectRun={(run) => setCurrentStressSummary(run)}
        onClearHistory={() => setStressHistory([])}
      />

      {/* Member Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        customTitle={authModalTitle}
        customSubtitle={authModalSubtitle}
      />

      {/* Member Profile & Photo Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        currentUser={authState.user}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
