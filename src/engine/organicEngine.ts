import {
  ActiveVisitorSession,
  CrawledPage,
  GeoCountry,
  LiveTelemetryEvent,
  OrganicRunSummary,
  OrganicVisitorConfig,
  ProxyNode,
  RealHttpTrafficHit,
  VisitedPageStep,
} from '../types';
import { GLOBAL_COUNTRIES } from '../data/organicPresets';
import {
  buildOrganicReferrer,
  generateVisitorFingerprint,
} from './fingerprintGenerator';

export interface OrganicEngineCallbacks {
  onActiveVisitorsUpdate: (visitors: ActiveVisitorSession[]) => void;
  onTelemetryEvent: (event: LiveTelemetryEvent) => void;
  onHttpTrafficHit?: (hit: RealHttpTrafficHit) => void;
  onStatsUpdate: (stats: {
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
  }) => void;
  onComplete: (summary: OrganicRunSummary) => void;
  onError?: (err: any) => void;
}

export class OrganicTrafficEngine {
  private config: OrganicVisitorConfig;
  private pagesPool: CrawledPage[];
  private callbacks: OrganicEngineCallbacks;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private timer: any = null;
  private startTime: number = 0;
  private visitorCounter: number = 0;

  // Active state
  private activeVisitors: Map<string, ActiveVisitorSession> = new Map();
  private completedSessions: ActiveVisitorSession[] = [];
  private totalPageViews: number = 0;
  private bouncedSessions: number = 0;
  private totalDwellAccumulator: number = 0;
  private sourcesCount = { organic: 0, social: 0, direct: 0, referral: 0 };
  private countryCount: Record<string, number> = {};
  private topLandingViews: Record<string, { title: string; count: number; timeSec: number }> = {};
  private topKeywordVisits: Record<string, number> = {};
  private ga4EventsCount: number = 0;

  // Catalog unvisited queue & country history for repetition / non-repetition
  private catalogUnvisitedQueue: CrawledPage[] = [];
  private lastUsedCountryCodes: string[] = [];
  private countryRotationIndex: number = 0;
  private persistentProfiles: Array<{
    gaClientId: string;
    country: GeoCountry;
    deviceType: string;
    userAgent: string;
    ipAddress: string;
    browserVendor: string;
    screenResolution: string;
  }> = [];

  constructor(
    config: OrganicVisitorConfig,
    pagesPool: CrawledPage[],
    callbacks: OrganicEngineCallbacks
  ) {
    this.config = config;
    
    let targetOrigin = config.targetUrl;
    try {
      if (config.targetUrl.startsWith('http://') || config.targetUrl.startsWith('https://')) {
        targetOrigin = new URL(config.targetUrl).origin;
      }
    } catch {}

    const validPages = pagesPool.filter(p => p.includedInVisits).map(p => {
      let fullUrl = p.url;
      try {
        if (targetOrigin.startsWith('http')) {
          const pagePath = p.path.startsWith('/') ? p.path : `/${p.path}`;
          fullUrl = `${targetOrigin}${pagePath}`;
        }
      } catch {}
      return {
        ...p,
        url: fullUrl,
      };
    });

    this.pagesPool = validPages.length > 0 ? validPages : [
      {
        id: 'fallback_root',
        url: config.targetUrl,
        path: '/',
        title: 'Home Page',
        description: 'Landing Page',
        depth: 0,
        status: 200,
        includedInVisits: true,
        visitWeight: 100,
        gaDetected: true,
      }
    ];
    this.callbacks = callbacks;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.activeVisitors.clear();
    this.completedSessions = [];
    this.totalPageViews = 0;
    this.bouncedSessions = 0;
    this.totalDwellAccumulator = 0;
    this.sourcesCount = { organic: 0, social: 0, direct: 0, referral: 0 };
    this.countryCount = {};
    this.topLandingViews = {};
    this.topKeywordVisits = {};
    this.ga4EventsCount = 0;
    this.catalogUnvisitedQueue = [];
    this.lastUsedCountryCodes = [];
    this.countryRotationIndex = 0;
    this.persistentProfiles = [];

    // Fill initial concurrent visitor pool
    const targetConcurrent = Math.max(1, this.config.behavior.activeConcurrentVisitors || 5);
    for (let i = 0; i < targetConcurrent; i++) {
      this.spawnVisitor();
    }

    // Engine Main Loop Ticker (runs every 500ms)
    this.timer = setInterval(() => {
      this.tick();
    }, 500);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const summary = this.generateSummary();
    this.callbacks.onComplete(summary);
  }

  private selectProxyForSession(country: GeoCountry, isInternalPageTransition: boolean = false): ProxyNode | null {
    const proxyEngine = this.config.fingerprint.proxyEngine;
    if (!proxyEngine || !proxyEngine.enabled || !proxyEngine.proxies || proxyEngine.proxies.length === 0) {
      return null;
    }

    const activeProxies = proxyEngine.proxies.filter(p => p.enabled !== false && p.status !== 'failed');
    if (activeProxies.length === 0) return null;

    // Filter by selected regions if specified
    const selectedRegs = (proxyEngine.selectedRegions && proxyEngine.selectedRegions.length > 0 && !proxyEngine.selectedRegions.includes('all'))
      ? proxyEngine.selectedRegions
      : [];

    let candidatePool = activeProxies;
    if (selectedRegs.length > 0) {
      const regionFiltered = activeProxies.filter(p => {
        if (!p.region) return false;
        return selectedRegs.some(r => 
          p.region.toLowerCase() === r.toLowerCase() ||
          (r === 'Middle East & Africa' && (p.region === 'Middle East' || p.region === 'Africa')) ||
          (r === 'Americas' && (p.region === 'North America' || p.region === 'South America')) ||
          (r === 'Asia-Pacific' && (p.region === 'Asia' || p.region === 'Oceania'))
        );
      });
      if (regionFiltered.length > 0) {
        candidatePool = regionFiltered;
      }
    }

    // 1. Strict country match within candidate pool
    const matchingCountry = candidatePool.filter(p => p.countryCode.toUpperCase() === country.code.toUpperCase());
    if (matchingCountry.length > 0) {
      return matchingCountry[Math.floor(Math.random() * matchingCountry.length)];
    }

    // 2. Region matching proxy within candidate pool
    if (country.region) {
      const matchingRegion = candidatePool.filter(p => p.region && p.region.toLowerCase() === country.region?.toLowerCase());
      if (matchingRegion.length > 0) {
        return matchingRegion[Math.floor(Math.random() * matchingRegion.length)];
      }
    }

    // 3. Fallback to any active node in the user's selected candidate pool
    return candidatePool[Math.floor(Math.random() * candidatePool.length)];
  }

  private tick() {
    if (!this.isRunning || this.isPaused) return;

    const speed = Math.max(1, this.config.behavior.realTimeSpeedMultiplier || 1);
    const tickDeltaSeconds = 0.5 * speed;

    const targetVisits = this.config.behavior.targetTotalVisits || 0;
    const targetPageViews = this.config.behavior.targetTotalPageViews || 0;

    const visitorsToRemove: string[] = [];

    this.activeVisitors.forEach((visitor, visitorId) => {
      const currentPage = visitor.visitedPages[visitor.currentPageIndex];
      if (!currentPage) {
        visitorsToRemove.push(visitorId);
        return;
      }

      // Increment dwell time spent
      const prevDwell = currentPage.dwellSecondsSpent;
      currentPage.dwellSecondsSpent += tickDeltaSeconds;
      visitor.totalSessionDwellSeconds += tickDeltaSeconds;

      // Periodic 5-second GA4 user_engagement heartbeat to keep Realtime active user metrics alive
      if (
        this.config.ga4.sendEngagementEvents &&
        Math.floor(currentPage.dwellSecondsSpent / 5) > Math.floor(prevDwell / 5) &&
        currentPage.dwellSecondsSpent >= 5
      ) {
        this.dispatchGa4Beacon(visitor, 'user_engagement', currentPage.path, currentPage.title, 5000);
      }

      // Calculate progress on current page (0 - 100%)
      const pageProgress = Math.min(100, (currentPage.dwellSecondsSpent / Math.max(1, currentPage.dwellPlannedSeconds)) * 100);

      // 1. Simulate human scrolling based on dwell progress & scrollToEndOfPage setting
      if (this.config.behavior.simulateScroll) {
        const targetScroll = this.config.behavior.scrollToEndOfPage 
          ? Math.max(currentPage.scrollDepthPct, 96 + Math.floor(Math.random() * 4)) // 96-100% full scroll
          : currentPage.scrollDepthPct;

        // Smooth ease towards target scroll
        visitor.currentScrollDepthPct = Math.min(targetScroll, Math.round(targetScroll * (pageProgress / 80)));

        // If reached 95%+ and scrollToEndOfPage is enabled, mark footer reached
        if (visitor.currentScrollDepthPct >= 95 && !currentPage.hasScrolledToEnd) {
          currentPage.hasScrolledToEnd = true;
          visitor.footerReached = true;
          visitor.lastEventLog = `Reached end of page (100% footer & comments, pausing ${this.config.behavior.footerDwellPauseSeconds || 5}s)`;
          
          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: 'footer_scroll',
            pagePath: currentPage.path,
            pageTitle: currentPage.title,
            source: visitor.trafficSource,
            details: `Scrolled to end of page (100% depth) • Paused reading footer and comments section`,
            device: visitor.deviceType,
          });
        }
      }

      // 2. Simulate human cursor movement
      if (this.config.behavior.simulateMouseMovement) {
        visitor.cursorX = Math.round(25 + Math.sin(Date.now() / 1200 + visitor.visitorNumber) * 35 + Math.random() * 10);
        visitor.cursorY = Math.round(15 + (visitor.currentScrollDepthPct * 0.65) + Math.cos(Date.now() / 1500) * 15);
      }

      // 3. POPUP / INTERSTITIAL AD INTERACTION (Triggered once at 20-40% scroll)
      if (
        this.config.behavior.simulateAdClicks && 
        this.config.behavior.clickPopupAds && 
        !currentPage.hasPopupHandled && 
        pageProgress >= 25 && 
        pageProgress <= 55
      ) {
        currentPage.hasPopupHandled = true;
        visitor.popupInteractions = (visitor.popupInteractions || 0) + 1;
        visitor.status = 'handling_popup';
        visitor.cursorX = Math.round(48 + Math.random() * 8);
        visitor.cursorY = Math.round(38 + Math.random() * 12);
        
        const popupAdTypes = [
          'Newsletter Lightbox Modal Ad',
          'Google AdSense Interstitial Overlay',
          'Sponsored Webinar Entry Popup',
          'Special Offer Banner Overlay',
          'Exit-Intent Sticky Discount Modal'
        ];
        const popupName = popupAdTypes[Math.floor(Math.random() * popupAdTypes.length)];
        const actionLabel = this.config.behavior.popupAction === 'click_and_close' 
          ? 'Clicked Call-to-Action & Dismissed' 
          : this.config.behavior.popupAction === 'click_ad_content' 
            ? 'Clicked Ad Promo Link' 
            : 'Dismissed After Dwell';
            
        visitor.lastEventLog = `Popup Ad: ${popupName} (${actionLabel})`;
        currentPage.lastAdClickTarget = popupName;

        // Dispatch GA4 ad engagement beacon
        if (this.config.ga4.sendEngagementEvents) {
          this.dispatchGa4Beacon(visitor, 'select_promotion', currentPage.path, `Popup - ${popupName}`);
        }

        this.callbacks.onTelemetryEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: Date.now(),
          visitorId: visitor.visitorId,
          countryCode: visitor.country.code,
          countryFlag: visitor.country.flag,
          eventType: 'popup_interaction',
          pagePath: currentPage.path,
          pageTitle: currentPage.title,
          source: visitor.trafficSource,
          details: `Interacted with ${popupName} • Action: ${actionLabel} at (${visitor.cursorX}%, ${visitor.cursorY}%)`,
          device: visitor.deviceType,
          adDetails: {
            adType: 'popup',
            adSlot: 'interstitial_overlay',
            adNetwork: 'Google Ad Manager',
          }
        });
      }

      // 3.5. SIMULATED BROWSER PAGE RELOAD (F5 / Refresh)
      if (
        this.config.behavior.simulatePageReload &&
        !currentPage.hasReloaded &&
        pageProgress >= 40 &&
        pageProgress <= 70
      ) {
        const reloadChance = (this.config.behavior.pageReloadProbabilityPct || 30) / 100;
        if (Math.random() < reloadChance) {
          currentPage.hasReloaded = true;
          visitor.reloadsPerformed = (visitor.reloadsPerformed || 0) + 1;
          visitor.status = 'reloading_page';
          visitor.cursorX = 12; // Refresh button in top browser chrome
          visitor.cursorY = 5;
          visitor.lastEventLog = `Simulated browser refresh (F5) • Reloaded page & revalidated cache`;

          // Add extra dwell time for reload pause
          currentPage.dwellSecondsSpent = Math.max(0, currentPage.dwellSecondsSpent - 4);

          // Dispatch real HTTP hit for reload
          this.dispatchRealHttpRequest(visitor, currentPage.url, currentPage.path, `${currentPage.title} (Reload F5)`);

          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: 'page_reload',
            pagePath: currentPage.path,
            pageTitle: currentPage.title,
            source: visitor.trafficSource,
            details: `Triggered browser refresh (F5 / Reload) • Re-fetching HTML resources (IP: ${visitor.ipAddress})`,
            device: visitor.deviceType,
          });
        } else {
          currentPage.hasReloaded = true; // Evaluated and passed for this page
        }
      }

      // 4. IN-ARTICLE LINKS CLICKING (Click at least 2 links in the post article)
      const articleLinksPlanned = currentPage.articleLinksPlanned || 0;
      const articleLinksClicked = currentPage.articleLinksClicked || 0;
      if (
        this.config.behavior.simulateArticleLinks && 
        articleLinksPlanned > 0 && 
        articleLinksClicked < articleLinksPlanned
      ) {
        // Trigger click at staggered intervals across the article body (e.g. 30%, 55%, 75%)
        const linkSlotProgress = ((articleLinksClicked + 1) / (articleLinksPlanned + 1)) * 85;
        if (pageProgress >= linkSlotProgress && Math.random() < 0.75) {
          currentPage.articleLinksClicked = articleLinksClicked + 1;
          visitor.totalArticleLinksClicked = (visitor.totalArticleLinksClicked || 0) + 1;
          
          const inArticleTopics = [
            'In-article link: [Comprehensive Architecture Guide 2026]',
            'In-article link: [Benchmarking Core Web Vitals & LCP]',
            'In-article link: [Related Post: 10 Advanced SEO Techniques]',
            'In-article link: [Table of Contents: Section 3 - Best Practices]',
            'In-article link: [External Reference: W3C Performance Spec]',
            'In-article link: [Author Citation: Modern Cloud Scaling]',
            'In-article link: [Related Post: High-Converting Landing Pages]',
            'In-article link: [Deep Dive: Global CDN & Edge Latency]'
          ];
          const chosenLink = inArticleTopics[Math.floor(Math.random() * inArticleTopics.length)];
          
          visitor.status = 'clicking_link';
          visitor.cursorX = Math.round(30 + Math.random() * 45); // Inside content column
          visitor.cursorY = Math.round(Math.max(15, visitor.currentScrollDepthPct + (Math.random() * 12 - 6)));
          visitor.lastEventLog = `Clicked ${chosenLink} (${currentPage.articleLinksClicked}/${articleLinksPlanned} article links)`;
          currentPage.lastClickTarget = chosenLink;

          // Dispatch GA4 in-article click beacon
          if (this.config.ga4.sendEngagementEvents) {
            this.dispatchGa4Beacon(visitor, 'click', currentPage.path, chosenLink);
          }

          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: 'article_link_click',
            pagePath: currentPage.path,
            pageTitle: currentPage.title,
            source: visitor.trafficSource,
            details: `Clicked ${chosenLink} inside post article body at (${visitor.cursorX}%, ${visitor.cursorY}%) • Link #${currentPage.articleLinksClicked} of ${articleLinksPlanned}`,
            device: visitor.deviceType,
          });
        }
      }

      // 5. BANNER ADS & NATIVE ADS CLICK ENGINE
      const adClicksPlanned = currentPage.adClicksPlanned || 0;
      const adClicksPerformed = currentPage.adClicksPerformed || 0;
      if (
        this.config.behavior.simulateAdClicks && 
        adClicksPlanned > 0 && 
        adClicksPerformed < adClicksPlanned
      ) {
        const adSlotProgress = ((adClicksPerformed + 1) / (adClicksPlanned + 1)) * 90;
        const ctrChance = (this.config.behavior.adClickThroughRatePct || 75) / 100;
        
        if (pageProgress >= adSlotProgress && Math.random() < ctrChance) {
          currentPage.adClicksPerformed = adClicksPerformed + 1;
          visitor.totalAdClicks = (visitor.totalAdClicks || 0) + 1;

          // Available ad formats
          const availableAdFormats: { name: string; type: 'banner' | 'native' | 'sticky' | 'sidebar'; slot: string; network: string; x: number; y: number }[] = [];
          
          if (this.config.behavior.clickBannerAds) {
            availableAdFormats.push({ name: 'Header Top Leaderboard Banner (728x90)', type: 'banner', slot: 'top_header_728x90', network: 'Google AdSense', x: 50, y: 8 });
            availableAdFormats.push({ name: 'In-Article Responsive Display Banner (300x250)', type: 'banner', slot: 'in_content_300x250', network: 'Mediavine / Ezoic', x: 52, y: Math.max(20, visitor.currentScrollDepthPct) });
            availableAdFormats.push({ name: 'Sidebar Skyscraper Ad Banner (300x600)', type: 'sidebar', slot: 'sidebar_300x600', network: 'Google Publisher Tag', x: 85, y: Math.max(15, visitor.currentScrollDepthPct - 10) });
          }
          if (this.config.behavior.clickNativeAds) {
            availableAdFormats.push({ name: 'Sponsored Content Recommendation Grid Tile', type: 'native', slot: 'taboola_recommended_widget', network: 'Taboola / Outbrain', x: 45, y: 85 });
            availableAdFormats.push({ name: 'Sponsored Product Card Tile', type: 'native', slot: 'sponsored_product_widget', network: 'Amazon Native Ads', x: 60, y: 70 });
          }
          if (this.config.behavior.clickStickyAds) {
            availableAdFormats.push({ name: 'Sticky Bottom Floating Anchor Banner (970x90)', type: 'sticky', slot: 'bottom_anchor_970x90', network: 'AdThrive / Raptive', x: 50, y: 92 });
          }

          if (availableAdFormats.length > 0) {
            const pickedAd = availableAdFormats[Math.floor(Math.random() * availableAdFormats.length)];
            visitor.status = 'clicking_ad';
            visitor.cursorX = Math.round(pickedAd.x + (Math.random() * 6 - 3));
            visitor.cursorY = Math.round(pickedAd.y + (Math.random() * 6 - 3));
            visitor.lastEventLog = `Clicked Ad: ${pickedAd.name} (${currentPage.adClicksPerformed}/${adClicksPlanned})`;
            currentPage.lastAdClickTarget = pickedAd.name;

            // Dispatch GA4 ad click beacon
            if (this.config.ga4.sendEngagementEvents) {
              this.dispatchGa4Beacon(visitor, 'select_content', currentPage.path, `Ad - ${pickedAd.name}`);
            }

            this.callbacks.onTelemetryEvent({
              id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              timestamp: Date.now(),
              visitorId: visitor.visitorId,
              countryCode: visitor.country.code,
              countryFlag: visitor.country.flag,
              eventType: 'ad_click',
              pagePath: currentPage.path,
              pageTitle: currentPage.title,
              source: visitor.trafficSource,
              details: `Clicked ${pickedAd.name} [${pickedAd.network}] at (${visitor.cursorX}%, ${visitor.cursorY}%) • Ad #${currentPage.adClicksPerformed} of ${adClicksPlanned}`,
              device: visitor.deviceType,
              adDetails: {
                adType: pickedAd.type,
                adSlot: pickedAd.slot,
                adNetwork: pickedAd.network,
              }
            });
          }
        }
      }

      // 6. Generic Random Human Element Clicks
      if (
        this.config.behavior.simulateRandomClicks && 
        currentPage.plannedClicks > 0 && 
        currentPage.clicksPerformed < currentPage.plannedClicks
      ) {
        const clickSlotPct = ((currentPage.clicksPerformed + 1) / (currentPage.plannedClicks + 1)) * 90;
        if (pageProgress >= clickSlotPct && Math.random() < 0.6) {
          currentPage.clicksPerformed += 1;
          const elementTargets = [
            'Call-to-Action button',
            'Interactive feature card',
            'Navigation dropdown item',
            'Product review summary',
            'Image gallery preview',
            'Section accordion expander',
            'Sidebar related topic',
            'Table of contents link',
            'Interactive data chart'
          ];
          const targetName = elementTargets[Math.floor(Math.random() * elementTargets.length)];
          currentPage.lastClickTarget = targetName;
          visitor.status = 'clicking_element';
          visitor.cursorX = Math.round(15 + Math.random() * 70);
          visitor.cursorY = Math.round(Math.max(10, visitor.currentScrollDepthPct + (Math.random() * 20 - 10)));
          visitor.lastEventLog = `Clicked ${targetName} at (${visitor.cursorX}%, ${visitor.cursorY}%)`;

          // Dispatch GA4 click interaction event
          if (this.config.ga4.sendEngagementEvents) {
            this.dispatchGa4Beacon(visitor, 'click', currentPage.path, `${currentPage.title} - ${targetName}`);
          }

          // Emit Live Telemetry Event
          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: 'page_click',
            pagePath: currentPage.path,
            pageTitle: currentPage.title,
            source: visitor.trafficSource,
            details: `Random human click on "${targetName}" at (${visitor.cursorX}%, ${visitor.cursorY}%) • IP: ${visitor.ipAddress || visitor.country.ipSample}`,
            device: visitor.deviceType,
          });
        }
      }

      // Status text updates
      if (visitor.status !== 'clicking_element' && visitor.status !== 'clicking_link' && visitor.status !== 'clicking_ad' && visitor.status !== 'handling_popup') {
        if (pageProgress < 30) {
          visitor.status = 'reading';
          visitor.lastEventLog = `Reading post article content (${Math.round(currentPage.dwellSecondsSpent)}s / ${currentPage.dwellPlannedSeconds}s, scroll: ${visitor.currentScrollDepthPct}%)`;
        } else if (pageProgress < 75) {
          visitor.status = 'scrolling';
          visitor.lastEventLog = `Scrolling article (${visitor.currentScrollDepthPct}% depth, ${currentPage.articleLinksClicked || 0}/${currentPage.articleLinksPlanned || 0} links, ${currentPage.adClicksPerformed || 0} ads clicked)`;
        } else if (pageProgress < 95) {
          visitor.status = 'reading';
          visitor.lastEventLog = `Reviewing comments & author section (${visitor.currentScrollDepthPct}% scroll)`;
        } else {
          visitor.status = 'clicking_link';
          visitor.lastEventLog = visitor.currentPageIndex + 1 < visitor.totalPlannedPages 
            ? `Navigating to internal page: ${visitor.visitedPages[visitor.currentPageIndex + 1]?.path || 'next'}`
            : `Completing visitor session`;
        }
      }

      // Check if page dwell completed
      if (currentPage.dwellSecondsSpent >= currentPage.dwellPlannedSeconds) {
        currentPage.status = 'completed';
        currentPage.endedAt = Date.now();

        // Dispatch GA4 user_engagement & scroll events
        this.dispatchGa4Beacon(visitor, 'user_engagement', currentPage.path, currentPage.title, Math.round(currentPage.dwellSecondsSpent * 1000));
        if (currentPage.scrollDepthPct >= 80 && this.config.ga4.sendScrollEvents) {
          this.dispatchGa4Beacon(visitor, 'scroll', currentPage.path, currentPage.title);
        }

        // Check if more pages to visit in this session
        const hasReachedPageviewsLimit = targetPageViews > 0 && this.totalPageViews >= targetPageViews;

        if (!visitor.isBounced && visitor.currentPageIndex + 1 < visitor.totalPlannedPages && !hasReachedPageviewsLimit) {
          visitor.currentPageIndex += 1;
          const nextPage = visitor.visitedPages[visitor.currentPageIndex];
          nextPage.status = 'visiting';
          nextPage.startedAt = Date.now();
          visitor.currentScrollDepthPct = 0;
          this.totalPageViews += 1;

          // Auto-Rotate Proxy / IP per page if configured
          const proxyEngine = this.config.fingerprint.proxyEngine;
          if (proxyEngine && proxyEngine.enabled && (proxyEngine.rotationStrategy === 'every_page_view' || proxyEngine.mode === 'auto_rotate')) {
            const rotatedProxy = this.selectProxyForSession(visitor.country, true);
            if (rotatedProxy) {
              visitor.proxyUsed = rotatedProxy;
              visitor.ipAddress = rotatedProxy.exitIp || rotatedProxy.host;
            }
          }

          this.recordPageStats(nextPage.path, nextPage.title, nextPage.dwellPlannedSeconds);

          // Update Referrer for internal page transition
          if (this.config.organic.forceGoogleSearchOnAllLinks) {
            const { referrerUrl: nextReferrerUrl, referrerName: nextReferrerName } = buildOrganicReferrer(
              'Organic Search',
              '',
              this.config.targetUrl,
              'google',
              'twitter',
              undefined,
              visitor.country.code,
              nextPage.title,
              nextPage.path,
              true,
              this.config.organic.googleReferrerMode || 'country_localized'
            );
            visitor.referrerUrl = nextReferrerUrl;
            visitor.referrerName = nextReferrerName;
          } else {
            // Natural internal referrer from previous page
            visitor.referrerUrl = `${this.config.targetUrl}${currentPage.path}`;
            visitor.referrerName = `Internal Link (${currentPage.title || currentPage.path})`;
          }

          // Dispatch GA4 page_view for internal transition
          this.dispatchGa4Beacon(visitor, 'page_view', nextPage.path, nextPage.title);

          // Dispatch REAL HTTP request to target server for internal page
          this.dispatchRealHttpRequest(visitor, nextPage.url, nextPage.path, nextPage.title);

          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: 'page_click',
            pagePath: nextPage.path,
            pageTitle: nextPage.title,
            source: visitor.trafficSource,
            details: `Internal page navigation ➔ ${nextPage.path} (Dwell: ${nextPage.dwellPlannedSeconds}s, Exit IP: ${visitor.ipAddress})`,
            device: visitor.deviceType,
          });
        } else {
          // Session is finished
          visitor.status = visitor.isBounced ? 'bounced' : 'completed';
          this.totalDwellAccumulator += visitor.totalSessionDwellSeconds;
          this.completedSessions.push(visitor);
          visitorsToRemove.push(visitorId);

          this.callbacks.onTelemetryEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            visitorId: visitor.visitorId,
            countryCode: visitor.country.code,
            countryFlag: visitor.country.flag,
            eventType: visitor.isBounced ? 'bounce' : 'session_end',
            pagePath: currentPage.path,
            pageTitle: currentPage.title,
            source: visitor.trafficSource,
            details: visitor.isBounced
              ? `Session Bounced after ${Math.round(visitor.totalSessionDwellSeconds)}s on single page`
              : `Session Completed (${visitor.visitedPages.length} pages viewed, total dwell ${Math.round(visitor.totalSessionDwellSeconds)}s, ${visitor.visitedPages.reduce((acc, p) => acc + (p.clicksPerformed || 0), 0)} interactions)`,
            device: visitor.deviceType,
          });
        }
      }
    });

    // Remove finished visitors
    visitorsToRemove.forEach(id => {
      this.activeVisitors.delete(id);
    });

    // Check if target limits reached
    const visitsLimitReached = targetVisits > 0 && this.visitorCounter >= targetVisits;
    const pageViewsLimitReached = targetPageViews > 0 && this.totalPageViews >= targetPageViews;

    if ((visitsLimitReached || pageViewsLimitReached) && this.activeVisitors.size === 0) {
      this.stop();
      return;
    }

    // Spawn new visitors if target limit not reached
    const targetConcurrent = Math.max(1, this.config.behavior.activeConcurrentVisitors || 5);
    while (this.activeVisitors.size < targetConcurrent && this.isRunning && !visitsLimitReached && !pageViewsLimitReached) {
      this.spawnVisitor();
    }

    // Broadcast active visitors snapshot
    this.callbacks.onActiveVisitorsUpdate(Array.from(this.activeVisitors.values()));

    // Broadcast summary statistics
    const totalCompleted = this.completedSessions.length;
    const avgDwell = totalCompleted > 0 ? Math.round(this.totalDwellAccumulator / totalCompleted) : 0;

    let liveArticleLinks = 0;
    let liveAdClicks = 0;
    let livePopups = 0;
    let liveFooterCount = 0;

    this.completedSessions.forEach(v => {
      liveArticleLinks += v.totalArticleLinksClicked || 0;
      liveAdClicks += v.totalAdClicks || 0;
      livePopups += v.popupInteractions || 0;
      if (v.footerReached) liveFooterCount++;
    });

    this.activeVisitors.forEach(v => {
      liveArticleLinks += v.totalArticleLinksClicked || 0;
      liveAdClicks += v.totalAdClicks || 0;
      livePopups += v.popupInteractions || 0;
      if (v.footerReached) liveFooterCount++;
    });

    const totalSessionsTracked = this.completedSessions.length + this.activeVisitors.size;
    const fullScrollPct = totalSessionsTracked > 0 ? Math.round((liveFooterCount / totalSessionsTracked) * 100) : 0;

    this.callbacks.onStatsUpdate({
      totalVisitorsDispatched: this.visitorCounter,
      totalPageViews: this.totalPageViews,
      bouncedSessions: this.bouncedSessions,
      avgEngagementSec: avgDwell,
      activeCount: this.activeVisitors.size,
      sourcesCount: this.sourcesCount,
      countryCount: this.countryCount,
      totalArticleLinksClicked: liveArticleLinks,
      totalAdClicks: liveAdClicks,
      totalPopupInteractions: livePopups,
      fullScrollRatePct: fullScrollPct,
    });
  }

  private spawnVisitor() {
    this.visitorCounter += 1;
    const visitorNumber = this.visitorCounter;
    const visitorId = `vis_${visitorNumber}_${Math.random().toString(36).substr(2, 6)}`;

    // =========================================================================
    // 1. DYNAMIC GEO SELECTION: Strictly respects user's selected region & country
    // =========================================================================
    const allConfigured = this.config.fingerprint.countries && this.config.fingerprint.countries.length > 0
      ? this.config.fingerprint.countries
      : GLOBAL_COUNTRIES;

    let enabledCountries = allConfigured.filter(c => c.enabled !== false && (c.weight ?? 1) > 0);
    if (enabledCountries.length === 0) enabledCountries = allConfigured;

    // Check if Proxy Engine has specific region or proxy filters
    const proxyEngine = this.config.fingerprint.proxyEngine;
    if (proxyEngine?.enabled) {
      const activeProxies = (proxyEngine.proxies || []).filter(p => p.enabled !== false && p.status !== 'failed');
      const selectedRegs = (proxyEngine.selectedRegions && proxyEngine.selectedRegions.length > 0 && !proxyEngine.selectedRegions.includes('all'))
        ? proxyEngine.selectedRegions
        : [];

      if (selectedRegs.length > 0) {
        const regionMatched = enabledCountries.filter(c => {
          if (!c.region) return false;
          return selectedRegs.some(r => 
            c.region?.toLowerCase() === r.toLowerCase() ||
            (r === 'Middle East & Africa' && (c.region === 'Middle East' || c.region === 'Africa')) ||
            (r === 'Americas' && (c.region === 'North America' || c.region === 'South America')) ||
            (r === 'Asia-Pacific' && (c.region === 'Asia' || c.region === 'Oceania'))
          );
        });

        if (regionMatched.length > 0) {
          enabledCountries = regionMatched;
        } else {
          // If no enabled countries matched, look across global countries in those regions
          const globalRegionMatched = GLOBAL_COUNTRIES.filter(c => 
            selectedRegs.some(r => 
              c.region?.toLowerCase() === r.toLowerCase() ||
              (r === 'Middle East & Africa' && (c.region === 'Middle East' || c.region === 'Africa')) ||
              (r === 'Americas' && (c.region === 'North America' || c.region === 'South America')) ||
              (r === 'Asia-Pacific' && (c.region === 'Asia' || c.region === 'Oceania'))
            )
          );
          if (globalRegionMatched.length > 0) {
            enabledCountries = globalRegionMatched;
          }
        }
      }

      // If strict geo matching with enabled proxy list is active
      if (activeProxies.length > 0 && (proxyEngine.strictGeoMatching || proxyEngine.mode === 'country_match')) {
        const proxyCodes = new Set(activeProxies.map(p => p.countryCode.toUpperCase()));
        const codeMatched = enabledCountries.filter(c => proxyCodes.has(c.code.toUpperCase()));
        if (codeMatched.length > 0) {
          enabledCountries = codeMatched;
        }
      }
    }

    const pool = enabledCountries;
    const geoMode = this.config.fingerprint.geoMode || 'random_worldwide';
    const countryRepetitionMode = this.config.fingerprint.countryRepetitionMode || 'round_robin_distinct';

    let selectedCountry: GeoCountry = pool[0] || GLOBAL_COUNTRIES[0];

    if (geoMode === 'round_robin') {
      // Strict Round-Robin across all enabled countries
      this.countryRotationIndex = (this.countryRotationIndex + 1) % pool.length;
      selectedCountry = pool[this.countryRotationIndex];
    } else if (geoMode === 'random_worldwide' || geoMode === 'random_regions') {
      // Group enabled countries by region
      const regionMap = new Map<string, GeoCountry[]>();
      for (const c of pool) {
        const reg = c.region || 'Americas';
        if (!regionMap.has(reg)) regionMap.set(reg, []);
        regionMap.get(reg)!.push(c);
      }
      const regionKeys = Array.from(regionMap.keys());

      // Pick a random region first, ensuring wide spread
      const randomRegion = regionKeys[Math.floor(Math.random() * regionKeys.length)];
      const countriesInRegion = regionMap.get(randomRegion) || pool;

      if (countryRepetitionMode === 'round_robin_distinct' && pool.length > 3) {
        // Non-repetition: filter out recently used countries
        const nonRecent = countriesInRegion.filter(c => !this.lastUsedCountryCodes.includes(c.code));
        const candidates = nonRecent.length > 0 ? nonRecent : countriesInRegion;
        selectedCountry = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        // Random pick with replacement
        selectedCountry = countriesInRegion[Math.floor(Math.random() * countriesInRegion.length)];
      }
    } else {
      // Custom Weighted Country Distribution
      const totalWeight = pool.reduce((acc, c) => acc + (c.weight > 0 ? c.weight : 1), 0);
      if (totalWeight > 0) {
        let rand = Math.random() * totalWeight;
        for (const c of pool) {
          const w = c.weight > 0 ? c.weight : 1;
          if (rand < w) {
            selectedCountry = c;
            break;
          }
          rand -= w;
        }
      }
    }

    // Maintain recent country codes memory for non-repetition
    this.lastUsedCountryCodes.push(selectedCountry.code);
    if (this.lastUsedCountryCodes.length > Math.min(6, Math.max(1, Math.floor(pool.length / 2)))) {
      this.lastUsedCountryCodes.shift();
    }

    this.countryCount[selectedCountry.code] = (this.countryCount[selectedCountry.code] || 0) + 1;

    // 2. Generate Anti-Fingerprint Profile with Unique IP for Country
    const fingerprint = generateVisitorFingerprint(selectedCountry);

    // 3. Pick Traffic Source (Organic Search, Social, Direct, Referral)
    const sources = this.config.organic.sourceShares || { organicSearch: 50, socialMedia: 30, direct: 15, referral: 5 };
    const totalSourceWeight = (sources.organicSearch || 0) + (sources.socialMedia || 0) + (sources.direct || 0) + (sources.referral || 0) || 100;
    let sourceRand = Math.random() * totalSourceWeight;
    let chosenSource: 'Organic Search' | 'Social' | 'Direct' | 'Referral' = 'Organic Search';

    if (sourceRand < sources.organicSearch) {
      chosenSource = 'Organic Search';
    } else if (sourceRand < sources.organicSearch + sources.socialMedia) {
      chosenSource = 'Social';
    } else if (sourceRand < sources.organicSearch + sources.socialMedia + sources.direct) {
      chosenSource = 'Direct';
    } else {
      chosenSource = 'Referral';
    }

    if (chosenSource === 'Organic Search') this.sourcesCount.organic += 1;
    else if (chosenSource === 'Social') this.sourcesCount.social += 1;
    else if (chosenSource === 'Direct') this.sourcesCount.direct += 1;
    else this.sourcesCount.referral += 1;

    // Pick Keyword or Social Platform
    const keywords = this.config.organic.keywords.length > 0 ? this.config.organic.keywords : ['high performance web app'];
    const chosenKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    if (chosenSource === 'Organic Search') {
      this.topKeywordVisits[chosenKeyword] = (this.topKeywordVisits[chosenKeyword] || 0) + 1;
    }

    const socialPlatforms = ['twitter', 'linkedin', 'reddit', 'facebook', 'instagram', 'youtube'];
    const chosenSocial = socialPlatforms[Math.floor(Math.random() * socialPlatforms.length)];

    // 4. Decide Bounce vs Multi-page exploration
    const bounceThreshold = this.config.behavior.bounceRatePct || 25;
    const isBounced = Math.random() * 100 < bounceThreshold;
    if (isBounced) {
      this.bouncedSessions += 1;
    }

    const minPages = isBounced ? 1 : Math.max(1, this.config.behavior.minPagesPerVisit || 2);
    const maxPages = isBounced ? 1 : Math.max(minPages, this.config.behavior.maxPagesPerVisit || 4);
    const plannedPageCount = isBounced ? 1 : Math.floor(Math.random() * (maxPages - minPages + 1)) + minPages;

    // =========================================================================
    // 5. PAGE SELECTION & REPETITION / NON-REPETITION ENGINE
    // =========================================================================
    const availablePages = this.pagesPool.length > 0 ? [...this.pagesPool] : [];
    const pageRepetitionMode = this.config.behavior.pageRepetitionMode || 'strict_unique';
    const distinctCatalogTraversal = this.config.behavior.distinctCatalogTraversal ?? true;

    let landingPage: CrawledPage;

    if (distinctCatalogTraversal && availablePages.length > 1) {
      // Refill and shuffle unvisited queue if exhausted so every post/listing is visited
      if (this.catalogUnvisitedQueue.length === 0) {
        const deep = availablePages.filter(p => p.path !== '/' && p.path !== '');
        const poolToShuffle = deep.length > 0 
          ? [...deep, ...availablePages.filter(p => p.path === '/' || p.path === '')]
          : [...availablePages];
        
        for (let i = poolToShuffle.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [poolToShuffle[i], poolToShuffle[j]] = [poolToShuffle[j], poolToShuffle[i]];
        }
        this.catalogUnvisitedQueue = poolToShuffle;
      }
      landingPage = this.catalogUnvisitedQueue.shift() || availablePages[0];
    } else if (availablePages.length > 1) {
      // In Organic Search / Social, 70% of visits land directly on an article, category, or specific sub-page
      const preferDeepLanding = (chosenSource === 'Organic Search' || chosenSource === 'Social') && Math.random() < 0.70;
      if (preferDeepLanding) {
        // Pick among non-root pages (posts, categories, etc.) with weighted distribution
        const deepPages = availablePages.filter(p => p.path !== '/' && p.path !== '');
        if (deepPages.length > 0) {
          const totalDeepWeight = deepPages.reduce((acc, p) => acc + (p.visitWeight || 50), 0);
          let deepRand = Math.random() * totalDeepWeight;
          let picked = deepPages[0];
          for (const p of deepPages) {
            if (deepRand < (p.visitWeight || 50)) {
              picked = p;
              break;
            }
            deepRand -= (p.visitWeight || 50);
          }
          landingPage = picked;
        } else {
          landingPage = availablePages[0];
        }
      } else {
        // Land on root or first page
        landingPage = availablePages.find(p => p.path === '/' || p.path === '') || availablePages[0];
      }
    } else if (availablePages.length === 1) {
      landingPage = availablePages[0];
    } else {
      landingPage = {
        id: 'root',
        url: this.config.targetUrl,
        path: '/',
        title: 'Home Page',
        description: 'Landing',
        depth: 0,
        status: 200,
        includedInVisits: true,
        visitWeight: 100,
        gaDetected: true,
      };
    }

    const { referrerUrl, referrerName } = buildOrganicReferrer(
      chosenSource,
      chosenKeyword,
      this.config.targetUrl,
      'google',
      chosenSocial,
      undefined,
      selectedCountry.code,
      landingPage.title,
      landingPage.path,
      this.config.organic.forceGoogleSearchOnAllLinks,
      this.config.organic.googleReferrerMode || 'country_localized'
    );

    const visitedPages: VisitedPageStep[] = [];

    // Helper for dwell time and random clicks
    const minDwell = Math.max(5, this.config.behavior.minDwellSeconds || 20);
    const maxDwell = Math.max(minDwell + 5, this.config.behavior.maxDwellSeconds || 75);
    const minScroll = this.config.behavior.scrollMinDepthPct || 40;
    const maxScroll = this.config.behavior.scrollMaxDepthPct || 95;
    const minClicks = Math.max(0, this.config.behavior.minClicksPerPage ?? 1);
    const maxClicks = Math.max(minClicks, this.config.behavior.maxClicksPerPage ?? 3);

    // Helpers for article links and ad clicks
    const minArticleLinks = Math.max(1, this.config.behavior.minArticleLinksClicked ?? 2);
    const maxArticleLinks = Math.max(minArticleLinks, this.config.behavior.maxArticleLinksClicked ?? 4);
    const minAdClicks = Math.max(0, this.config.behavior.minAdClicksPerPage ?? 1);
    const maxAdClicks = Math.max(minAdClicks, this.config.behavior.maxAdClicksPerPage ?? 2);

    // Add Landing Page Step
    const landingDwell = Math.floor(Math.random() * (maxDwell - minDwell + 1)) + minDwell;
    const landingScroll = this.config.behavior.scrollToEndOfPage 
      ? Math.max(96 + Math.floor(Math.random() * 4), Math.floor(Math.random() * (maxScroll - minScroll + 1)) + minScroll)
      : Math.floor(Math.random() * (maxScroll - minScroll + 1)) + minScroll;
    const landingClicks = this.config.behavior.simulateRandomClicks ? Math.floor(Math.random() * (maxClicks - minClicks + 1)) + minClicks : 0;
    const landingArticleLinks = this.config.behavior.simulateArticleLinks ? Math.floor(Math.random() * (maxArticleLinks - minArticleLinks + 1)) + minArticleLinks : 0;
    const landingAdClicks = this.config.behavior.simulateAdClicks ? Math.floor(Math.random() * (maxAdClicks - minAdClicks + 1)) + minAdClicks : 0;

    visitedPages.push({
      url: landingPage.url,
      path: landingPage.path,
      title: landingPage.title,
      dwellPlannedSeconds: landingDwell,
      dwellSecondsSpent: 0,
      scrollDepthPct: landingScroll,
      plannedClicks: landingClicks,
      clicksPerformed: 0,
      articleLinksPlanned: landingArticleLinks,
      articleLinksClicked: 0,
      adClicksPlanned: landingAdClicks,
      adClicksPerformed: 0,
      hasPopupHandled: false,
      hasScrolledToEnd: false,
      status: 'visiting',
      startedAt: Date.now(),
    });

    this.totalPageViews += 1;
    this.recordPageStats(landingPage.path, landingPage.title, landingDwell);

    // Add subsequent internal pages (posts, categories, sub-pages)
    if (!isBounced && plannedPageCount > 1) {
      const chosenPaths = new Set<string>([landingPage.path]);

      for (let p = 1; p < plannedPageCount; p++) {
        let nextPage: CrawledPage;

        if (pageRepetitionMode === 'strict_unique') {
          // Strict Non-Repetition: only pick pages not yet visited in this session
          const candidates = availablePages.filter(pg => !chosenPaths.has(pg.path));
          if (candidates.length > 0) {
            const totalW = candidates.reduce((acc, c) => acc + (c.visitWeight || 50), 0);
            let wRand = Math.random() * totalW;
            let chosen = candidates[0];
            for (const c of candidates) {
              if (wRand < (c.visitWeight || 50)) {
                chosen = c;
                break;
              }
              wRand -= (c.visitWeight || 50);
            }
            nextPage = chosen;
            chosenPaths.add(nextPage.path);
          } else if (availablePages.length > 0) {
            nextPage = availablePages[p % availablePages.length];
          } else {
            nextPage = landingPage;
          }
        } else {
          // Repetition Allowed: pick from any page in the pool (e.g. browsing back to index/listings)
          const totalW = availablePages.reduce((acc, c) => acc + (c.visitWeight || 50), 0);
          let wRand = Math.random() * totalW;
          let chosen = availablePages[0];
          for (const c of availablePages) {
            if (wRand < (c.visitWeight || 50)) {
              chosen = c;
              break;
            }
            wRand -= (c.visitWeight || 50);
          }
          nextPage = chosen;
        }

        const subDwell = Math.floor(Math.random() * (maxDwell - minDwell + 1)) + minDwell;
        const subScroll = this.config.behavior.scrollToEndOfPage 
          ? Math.max(96 + Math.floor(Math.random() * 4), Math.floor(Math.random() * (maxScroll - minScroll + 1)) + minScroll)
          : Math.floor(Math.random() * (maxScroll - minScroll + 1)) + minScroll;
        const subClicks = this.config.behavior.simulateRandomClicks ? Math.floor(Math.random() * (maxClicks - minClicks + 1)) + minClicks : 0;
        const subArticleLinks = this.config.behavior.simulateArticleLinks ? Math.floor(Math.random() * (maxArticleLinks - minArticleLinks + 1)) + minArticleLinks : 0;
        const subAdClicks = this.config.behavior.simulateAdClicks ? Math.floor(Math.random() * (maxAdClicks - minAdClicks + 1)) + minAdClicks : 0;

        visitedPages.push({
          url: nextPage.url,
          path: nextPage.path,
          title: nextPage.title,
          dwellPlannedSeconds: subDwell,
          dwellSecondsSpent: 0,
          scrollDepthPct: subScroll,
          plannedClicks: subClicks,
          clicksPerformed: 0,
          articleLinksPlanned: subArticleLinks,
          articleLinksClicked: 0,
          adClicksPlanned: subAdClicks,
          adClicksPerformed: 0,
          hasPopupHandled: false,
          hasScrolledToEnd: false,
          status: 'visiting',
          startedAt: 0,
        });
      }
    }

    // =========================================================================
    // 6. VISITOR RETENTION & REPETITION MODE
    // =========================================================================
    const visitorRetentionMode = this.config.behavior.visitorRetentionMode || 'unique_only';
    let isReturning = false;
    let gaClientId: string;

    if (visitorRetentionMode === 'unique_only') {
      // 100% Brand-New Unique Visitors (Strict Non-Repetition)
      isReturning = false;
      gaClientId = `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`;
    } else {
      // Returning visitor mix allowed
      isReturning = Math.random() * 100 > (this.config.behavior.newVsReturningRatio || 75);
      if (isReturning && this.persistentProfiles.length > 0) {
        const saved = this.persistentProfiles[Math.floor(Math.random() * this.persistentProfiles.length)];
        gaClientId = saved.gaClientId;
      } else {
        gaClientId = `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000) - 86400 * 5}`;
        // Store in persistent pool for future return visits
        if (this.persistentProfiles.length < 50) {
          this.persistentProfiles.push({
            gaClientId,
            country: selectedCountry,
            deviceType: fingerprint.deviceType,
            userAgent: fingerprint.userAgent,
            ipAddress: fingerprint.ipAddress,
            browserVendor: fingerprint.webGlVendor,
            screenResolution: fingerprint.screenResolution,
          });
        }
      }
    }

    const gaSessionId = `${Math.floor(Date.now() / 1000)}`;

    // Select proxy node if enabled
    const selectedProxy = this.selectProxyForSession(selectedCountry, false);
    const finalCountry = (selectedProxy && (proxyEngine?.strictGeoMatching || proxyEngine?.mode === 'country_match'))
      ? (pool.find(c => c.code.toUpperCase() === selectedProxy.countryCode.toUpperCase()) || GLOBAL_COUNTRIES.find(c => c.code.toUpperCase() === selectedProxy.countryCode.toUpperCase()) || selectedCountry)
      : selectedCountry;

    const session: ActiveVisitorSession = {
      visitorId,
      visitorNumber,
      country: finalCountry,
      ipAddress: selectedProxy?.exitIp || selectedProxy?.host || fingerprint.ipAddress,
      proxyUsed: selectedProxy,
      deviceType: fingerprint.deviceType,
      userAgent: fingerprint.userAgent,
      screenResolution: fingerprint.screenResolution,
      browserVendor: fingerprint.webGlVendor,
      trafficSource: chosenSource,
      referrerUrl,
      referrerName,
      searchKeyword: chosenSource === 'Organic Search' ? chosenKeyword : undefined,
      gaClientId,
      gaSessionId,
      isReturning,
      isBounced,
      totalPlannedPages: plannedPageCount,
      currentPageIndex: 0,
      visitedPages,
      currentScrollDepthPct: 0,
      cursorX: 50,
      cursorY: 30,
      status: 'active',
      startedAt: Date.now(),
      totalSessionDwellSeconds: 0,
      lastEventLog: `Landed via ${referrerName} on ${landingPage.path}${selectedProxy ? ` (Proxy: ${selectedProxy.countryCode} ${selectedProxy.exitIp || selectedProxy.nodeUrl})` : ''}`,
    };

    this.activeVisitors.set(visitorId, session);

    // Initial Telemetry Events
    this.callbacks.onTelemetryEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      visitorId,
      countryCode: selectedCountry.code,
      countryFlag: selectedCountry.flag,
      eventType: 'session_start',
      pagePath: landingPage.path,
      pageTitle: landingPage.title,
      source: chosenSource,
      details: `${selectedCountry.flag} Visitor #${visitorNumber} (${selectedCountry.name}, IP: ${fingerprint.ipAddress}) arrived via ${referrerName}`,
      device: fingerprint.deviceType,
    });

    // GA4 session_start and first landing page_view
    this.dispatchGa4Beacon(session, 'session_start', landingPage.path, landingPage.title);
    if (!isReturning && this.config.ga4.sendSessionEvents) {
      this.dispatchGa4Beacon(session, 'first_visit', landingPage.path, landingPage.title);
    }
    this.dispatchGa4Beacon(session, 'page_view', landingPage.path, landingPage.title);

    // Dispatch REAL HTTP request to target server for landing page
    this.dispatchRealHttpRequest(session, landingPage.url, landingPage.path, landingPage.title);
  }

  private recordPageStats(path: string, title: string, dwellSec: number) {
    if (!this.topLandingViews[path]) {
      this.topLandingViews[path] = { title, count: 1, timeSec: dwellSec };
    } else {
      this.topLandingViews[path].count += 1;
      this.topLandingViews[path].timeSec += dwellSec;
    }
  }

  private formatProxyNodeUrl(proxy?: any): string | undefined {
    if (!proxy) return undefined;
    if (proxy.nodeUrl) return proxy.nodeUrl;
    if (!proxy.host || !proxy.port) return undefined;
    const auth = proxy.username ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password || '')}@` : '';
    return `${proxy.protocol || 'http'}://${auth}${proxy.host}:${proxy.port}`;
  }

  private async dispatchRealHttpRequest(
    visitor: ActiveVisitorSession,
    pageUrl: string,
    pagePath: string,
    pageTitle: string
  ) {
    try {
      const userIp = visitor.ipAddress || visitor.country.ipSample || '198.51.100.42';
      const proxyUrl = this.formatProxyNodeUrl(visitor.proxyUsed);

      const res = await fetch('/api/traffic/dispatch-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pageUrl,
          method: 'GET',
          proxyUrl,
          headers: {
            'User-Agent': visitor.userAgent,
            'Referer': visitor.referrerUrl,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': visitor.country.locale || 'en-US,en;q=0.9',
            'X-Forwarded-For': userIp,
            'X-Real-IP': userIp,
            'True-Client-IP': userIp,
            'CF-Connecting-IP': userIp,
            'Client-IP': userIp,
            'X-Client-IP': userIp,
            'CF-IPCountry': visitor.country.code,
            'X-Country-Code': visitor.country.code,
            'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'Sec-Ch-Ua-Mobile': visitor.deviceType.toLowerCase().includes('mobile') ? '?1' : '?0',
            'Sec-Ch-Ua-Platform': visitor.deviceType.includes('Mac') ? '"macOS"' : visitor.deviceType.includes('iOS') ? '"iOS"' : '"Windows"',
          },
          timeout: 10000,
        }),
      });

      const data = await res.json();
      const statusCode = data.statusCode || (data.success ? 200 : 0);
      const statusText = data.statusText || (data.success ? 'OK' : 'Error');
      const latencyMs = data.latencyMs || Math.round(30 + Math.random() * 80);
      const bytes = data.bytes || 1240;

      const hit: RealHttpTrafficHit = {
        id: `hit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        visitorId: visitor.visitorId,
        visitorNumber: visitor.visitorNumber,
        country: visitor.country.name,
        countryFlag: visitor.country.flag,
        url: pageUrl,
        path: pagePath,
        method: 'GET',
        statusCode,
        statusText,
        latencyMs,
        bytes,
        userAgent: visitor.userAgent,
        referrer: visitor.referrerUrl,
        source: visitor.trafficSource,
        device: visitor.deviceType,
        success: data.success ?? (statusCode >= 200 && statusCode < 400),
        headers: data.headers,
        proxyUsed: data.proxyUsed || !!proxyUrl,
      };

      if (this.callbacks.onHttpTrafficHit) {
        this.callbacks.onHttpTrafficHit(hit);
      }

      // Add real HTTP telemetry log
      this.callbacks.onTelemetryEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        visitorId: visitor.visitorId,
        countryCode: visitor.country.code,
        countryFlag: visitor.country.flag,
        eventType: 'page_view',
        pagePath,
        pageTitle,
        source: visitor.trafficSource,
        details: `[REAL HTTP] GET ${pagePath} ➔ ${statusCode} ${statusText} (${latencyMs}ms, ${(bytes / 1024).toFixed(1)} KB)${proxyUrl ? ' [Proxy]' : ''}`,
        device: visitor.deviceType,
      });
    } catch {
      // Non-blocking fallback
    }
  }

  private async dispatchGa4Beacon(
    visitor: ActiveVisitorSession,
    eventName: string,
    pagePath: string,
    pageTitle: string,
    engagementTimeMs: number = 0
  ) {
    this.ga4EventsCount += 1;
    if (!this.config.ga4.autoSendMeasurementProtocol) return;

    const measurementId = this.config.ga4.measurementId?.trim();
    const effectiveEngagement = Math.max(1200, engagementTimeMs || 2000);
    const campaignSource = visitor.trafficSource === 'Organic Search' ? 'google' : visitor.trafficSource === 'Social' ? 'social' : visitor.trafficSource.toLowerCase();
    const campaignMedium = visitor.trafficSource === 'Organic Search' ? 'organic' : visitor.trafficSource === 'Social' ? 'social' : visitor.trafficSource === 'Direct' ? '(none)' : 'referral';
    const pageLocation = `${this.config.targetUrl}${pagePath}`;

    // 1. Dispatch via Server-Side Proxy (with residential IP and Geo headers)
    try {
      const proxyUrl = this.formatProxyNodeUrl(visitor.proxyUsed);

      fetch('/api/ga4/collect-beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementId: measurementId || 'G-SIMULATED',
          apiSecret: this.config.ga4.apiSecret || undefined,
          clientId: visitor.gaClientId,
          sessionId: visitor.gaSessionId,
          eventName,
          pageTitle,
          pagePath,
          pageLocation,
          referrer: visitor.referrerUrl,
          engagementTimeMs: effectiveEngagement,
          userIp: visitor.country.ipSample || '198.51.100.42',
          countryCode: visitor.country.code,
          userAgent: visitor.userAgent,
          campaignSource,
          campaignMedium,
          campaignName: this.config.name || 'Organic Traffic Boost',
          proxyUrl,
        }),
      }).catch(() => {});
    } catch {}

    // 2. Dual Dispatch: Also send direct client-side beacon if valid GA4 ID is present
    if (measurementId && measurementId.startsWith('G-') && typeof window !== 'undefined') {
      try {
        const clientParams = new URLSearchParams({
          v: '2',
          tid: measurementId,
          cid: visitor.gaClientId,
          sid: visitor.gaSessionId,
          en: eventName || 'page_view',
          dl: pageLocation,
          dt: pageTitle,
          dr: visitor.referrerUrl || '',
          _s: '1',
          seg: '1',
          sct: '1',
          _ee: '1',
          _et: `${effectiveEngagement}`,
          'epn.engagement_time_msec': `${effectiveEngagement}`,
          ul: 'en-us',
          sr: '1920x1080',
        });

        if (campaignSource) clientParams.append('cs', campaignSource);
        if (campaignMedium) clientParams.append('cm', campaignMedium);

        const directGaUrl = `https://www.google-analytics.com/g/collect?${clientParams.toString()}`;
        
        // Use fetch with keepalive / no-cors
        if (typeof fetch === 'function') {
          fetch(directGaUrl, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {});
        }

        // Image beacon fallback
        if (typeof Image !== 'undefined') {
          const img = new Image();
          img.src = directGaUrl;
        }
      } catch {}
    }
  }

  public generateSummary(): OrganicRunSummary {
    const totalDurationSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const totalVisitors = this.visitorCounter;
    const totalCompleted = this.completedSessions.length;
    const avgEngagementTime = totalCompleted > 0 ? Math.round(this.totalDwellAccumulator / totalCompleted) : 0;
    const bounceRate = totalVisitors > 0 ? parseFloat(((this.bouncedSessions / totalVisitors) * 100).toFixed(1)) : 0;
    const avgPages = totalVisitors > 0 ? parseFloat((this.totalPageViews / totalVisitors).toFixed(1)) : 1;

    const topPagesArray = Object.entries(this.topLandingViews).map(([path, data]) => ({
      path,
      title: data.title,
      views: data.count,
      avgTimeSec: Math.round(data.timeSec / Math.max(1, data.count)),
    })).sort((a, b) => b.views - a.views);

    const topKeywordsArray = Object.entries(this.topKeywordVisits).map(([keyword, visits]) => ({
      keyword,
      visits,
    })).sort((a, b) => b.visits - a.visits);

    // Calculate aggregated article link clicks, ad clicks, and popup interactions
    let totalArticleLinks = 0;
    let totalAds = 0;
    let totalPopups = 0;
    let reachedFooterCount = 0;

    this.completedSessions.forEach(s => {
      totalArticleLinks += s.totalArticleLinksClicked || 0;
      totalAds += s.totalAdClicks || 0;
      totalPopups += s.popupInteractions || 0;
      if (s.footerReached) reachedFooterCount += 1;
    });

    // Also account for still-active sessions
    this.activeVisitors.forEach(s => {
      totalArticleLinks += s.totalArticleLinksClicked || 0;
      totalAds += s.totalAdClicks || 0;
      totalPopups += s.popupInteractions || 0;
      if (s.footerReached) reachedFooterCount += 1;
    });

    const fullScrollRate = totalVisitors > 0 ? parseFloat(((reachedFooterCount / totalVisitors) * 100).toFixed(1)) : 0;

    return {
      id: `summary_${Date.now()}`,
      campaignName: this.config.name,
      targetUrl: this.config.targetUrl,
      startTime: this.startTime,
      endTime: Date.now(),
      totalDurationSeconds,
      totalVisitorsDispatched: totalVisitors,
      totalPageViews: this.totalPageViews,
      bouncedSessions: this.bouncedSessions,
      bounceRatePct: bounceRate,
      avgEngagementTimeSeconds: avgEngagementTime,
      avgPagesPerSession: avgPages,
      sourcesBreakdown: this.sourcesCount,
      countryDistribution: this.countryCount,
      topLandingPages: topPagesArray,
      topKeywords: topKeywordsArray,
      ga4EventsDispatched: this.ga4EventsCount,
      totalArticleLinksClicked: totalArticleLinks,
      totalAdClicks: totalAds,
      totalPopupInteractions: totalPopups,
      fullScrollRatePct: fullScrollRate,
    };
  }
}
