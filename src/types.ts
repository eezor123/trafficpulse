export type TrafficAppMode = 'organic_visitor' | 'load_stress';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type LoadPattern = 'constant' | 'ramp' | 'spike' | 'diurnal' | 'chaos' | 'custom_steps';

export type EngineMode = 'server_proxy' | 'client_direct' | 'built_in_sandbox';

// ==========================================
// CRAWLER & SITE DISCOVERY TYPES
// ==========================================
export interface CrawledPage {
  id: string;
  url: string;
  path: string;
  title: string;
  description: string;
  depth: number;
  status: number;
  includedInVisits: boolean;
  visitWeight: number; // probability weight 1-100
  foundLinks?: string[];
  gaDetected: boolean;
  category?: 'post' | 'category' | 'page' | 'tag' | 'archive' | 'product' | 'other';
}

export interface RealHttpTrafficHit {
  id: string;
  timestamp: number;
  visitorId: string;
  visitorNumber: number;
  country: string;
  countryFlag: string;
  url: string;
  path: string;
  method: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  bytes: number;
  userAgent: string;
  referrer: string;
  source: string;
  device: string;
  success: boolean;
  headers?: Record<string, string>;
  proxyUsed?: boolean;
}

export interface DiscoveredRouteItem {
  id: string;
  url: string;
  path: string;
  title: string;
  description?: string;
  category?: 'post' | 'category' | 'page' | 'tag' | 'archive' | 'product' | 'other';
  depth: number;
  statusCode?: number;
  discoveredAt: number;
  sourceType: 'html_link' | 'script_bundle' | 'sitemap' | 'json_ld' | 'dom_pattern' | 'url_query' | 'user_import';
}

export interface SiteCrawlState {
  isCrawling: boolean;
  targetUrl: string;
  hostname: string;
  origin: string;
  title: string;
  description: string;
  gaMeasurementId?: string | null;
  gtmId?: string | null;
  pages: CrawledPage[];
  lastCrawledAt?: number;
  error?: string;
  statusCode?: number;
  latencyMs?: number;
  realLinksCount?: number;
  visitedUrlsCount?: number;
  recursivePassDepth?: number;
  listingPatternsMatched?: number;
  crawlProgressPct?: number; // 0 to 100
  crawlPhase?: string; // Current crawl phase label
  currentScanningUrl?: string; // Current URL/route being scanned
  recentlyDiscoveredRoutes?: DiscoveredRouteItem[]; // Dynamic stream of newly discovered routes
}

// ==========================================
// REFERRAL & TRAFFIC SOURCE TYPES
// ==========================================
export interface TrafficSourceShares {
  organicSearch: number; // e.g. 50%
  socialMedia: number;   // e.g. 30%
  direct: number;        // e.g. 15%
  referral: number;      // e.g. 5%
}

export interface SearchEngineShares {
  google: number;
  bing: number;
  duckduckgo: number;
  yahoo: number;
  baidu: number;
  yandex: number;
}

export interface SocialNetworkShares {
  twitter: number;
  linkedin: number;
  facebook: number;
  instagram: number;
  reddit: number;
  youtube: number;
  tiktok: number;
  pinterest: number;
}

export interface OrganicTrafficConfig {
  sourceShares: TrafficSourceShares;
  searchEngines: SearchEngineShares;
  keywords: string[];
  socialNetworks: SocialNetworkShares;
  customReferrers: { id: string; domain: string; url: string; weight: number }[];
  forceGoogleSearchOnAllLinks?: boolean; // Force Google Search Referrer on 100% of posts and page links
  googleReferrerMode?: 'country_localized' | 'google_com' | 'dynamic_query'; // Localized Google TLD (google.co.uk, google.de, etc.) or standard google.com
  autoGenerateKeywordFromPageTitle?: boolean; // Auto-generate authentic Google search queries from post titles & slugs
  utmConfig: {
    enabled: boolean;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
  };
}

// ==========================================
// HUMAN BEHAVIOR & DWELL SIMULATION
// ==========================================
export interface VisitorBehaviorConfig {
  targetTotalVisits?: number;    // 0 = continuous / unlimited, or target count e.g. 100, 500
  targetTotalPageViews?: number; // 0 = continuous / unlimited, or target count e.g. 500, 2000
  // DWELL & PAUSE PACING
  minDwellSeconds: number; // e.g. 30
  maxDwellSeconds: number; // e.g. 90
  pauseBetweenPagesSeconds?: number; // Reading pause / idle hesitation before navigating or reloading (e.g. 3-10s)
  pauseBetweenVisitsSeconds?: number; // Pacing cooldown gap between new visitor batches (e.g. 2-15s)
  simulatePageReload?: boolean; // Human page reload (F5 / Refresh) simulation during session
  pageReloadProbabilityPct?: number; // e.g. 25% chance visitor refreshes page
  minPagesPerVisit: number; // e.g. 2
  maxPagesPerVisit: number; // e.g. 5
  bounceRatePct: number;    // e.g. 22
  simulateScroll: boolean;
  scrollMinDepthPct: number; // e.g. 40
  scrollMaxDepthPct: number; // e.g. 95
  scrollToEndOfPage: boolean; // Scroll all the way to 95%-100% bottom of page (comments/footer)
  footerDwellPauseSeconds: number; // e.g. 3-8s pause at page bottom
  simulateRandomClicks: boolean; // Random link / element interaction simulation
  minClicksPerPage: number;  // e.g. 1
  maxClicksPerPage: number;  // e.g. 4
  
  // IN-ARTICLE LINKS CLICKING
  simulateArticleLinks: boolean; // Click links inside blog post / article body
  minArticleLinksClicked: number; // at least 2 links in the post article (default: 2)
  maxArticleLinksClicked: number; // default: 4
  articleLinkTypes: {
    inContentHyperlinks: boolean; // Contextual links inside paragraphs
    relatedPostsLinks: boolean;   // Links in "Related Articles" widgets
    tableOfContentsLinks: boolean;// Table of contents anchor links
    authorCitations: boolean;     // External or author citation links
  };

  // ADS INTERACTION & CLICKS (Banner, Popup, Native, Sticky)
  simulateAdClicks: boolean;      // Click ads across the page
  minAdClicksPerPage: number;     // e.g. 1
  maxAdClicksPerPage: number;     // e.g. 2
  adClickThroughRatePct: number;  // e.g. 70% probability
  clickBannerAds: boolean;        // Top header & in-content display banners
  clickPopupAds: boolean;         // Modal overlay ads, newsletter lightbox & exit popups
  clickNativeAds: boolean;        // Sponsored content / recommended widget links
  clickStickyAds: boolean;        // Floating sticky footer / sidebar banners
  popupAction: 'click_and_close' | 'click_ad_content' | 'dismiss_after_dwell';

  simulateMouseMovement: boolean;
  newVsReturningRatio: number; // e.g. 70 (70% new, 30% returning)
  pageRepetitionMode?: 'strict_unique' | 'allow_repeat'; // Strict non-repetition (unique pages) vs Allow repetition (revisiting)
  visitorRetentionMode?: 'unique_only' | 'mixed_returning'; // 100% Unique Visitors (Non-repeating client IDs) vs Returning visitor mix
  distinctCatalogTraversal?: boolean; // Traverse through all catalog posts/listings without repetition before looping
  realTimeSpeedMultiplier: number; // 1 = 1x real-time dwell (ideal for live GA4), 5 = 5x accelerated
  activeConcurrentVisitors: number; // e.g. 5 to 50 concurrent visitors
  sessionPacingJitter: number; // 0-100% variance in dwell pace

  // MOBILE-FIRST EXECUTION & LIGHTWEIGHT BEACON MODE
  mobileFirstMode?: boolean; // Prioritizes lightweight beacon payloads, optimized ticker, and reduced JS execution complexity
  lightweightPayloads?: boolean; // Compact GA4 query payloads for ultra-low latency mobile delivery
  reduceMobileThreadUsage?: boolean; // Throttles non-essential DOM animations & React state dispatches on mobile devices
}

// ==========================================
// MULTI-COUNTRY & ANTI-FINGERPRINTING
// ==========================================
export interface GeoCountry {
  code: string;
  name: string;
  flag: string;
  weight: number;
  locale: string;
  timezone: string;
  ipSample: string;
  region?: string;
  enabled?: boolean;
  city?: string;
  isp?: string;
  asn?: string;
}

export interface ProxyNode {
  id: string;
  protocol: 'http' | 'https' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  countryCode: string;
  countryName: string;
  flag?: string;
  countryFlag?: string;
  region?: string;
  city?: string;
  isp?: string;
  asn?: string;
  status: 'active' | 'testing' | 'failed' | 'idle';
  latencyMs?: number;
  realExitIp?: string;
  exitIp?: string;
  nodeUrl?: string;
  enabled?: boolean;
  lastTested?: number;
  isCustom?: boolean;
  proxyType?: 'residential' | 'datacenter' | 'mobile_4g' | 'mobile_4g_5g';
  type?: string;
  rotationType?: 'rotating' | 'sticky' | 'dedicated';
}

export interface ProxyEngineConfig {
  enabled: boolean;
  mode: 'auto_rotate' | 'country_match' | 'custom_list_only' | 'direct_fallback' | 'manual_pool';
  rotationStrategy: 'every_page_view' | 'sticky_session' | 'country_cluster' | 'every_session' | 'per_request';
  customProxyList: string;
  proxies: ProxyNode[];
  autoFetchPublicProxies: boolean;
  proxyType?: 'residential' | 'datacenter' | 'mobile_4g_5g';
  selectedRegions?: string[];
  strictGeoMatching?: boolean;
}

export interface AntiFingerprintConfig {
  enableAntiFingerprint: boolean;
  geoMode?: 'random_worldwide' | 'random_regions' | 'round_robin' | 'custom_weighted'; // Random visit from different region and country
  countryRepetitionMode?: 'round_robin_distinct' | 'random_with_replacement'; // Non-repetition (round-robin) vs random
  countries: GeoCountry[];
  devices: {
    desktopChromeWin: number;
    desktopChromeMac: number;
    desktopSafariMac: number;
    desktopEdgeWin: number;
    mobileIosSafari: number;
    mobileAndroidChrome: number;
    desktopFirefox: number;
  };
  randomizeScreenResolutions: boolean;
  maskCanvasAudioContext: boolean;
  spoofClientHints: boolean; // Sec-CH-UA
  injectGeoHeaders: boolean;  // X-Forwarded-For, CF-IPCountry
  simulateCookiePersistence: boolean; // _ga, _gid
  proxyEngine?: ProxyEngineConfig;
}

// ==========================================
// GOOGLE ANALYTICS GA4 DISPATCH CONFIG
// ==========================================
export interface Ga4TrackerConfig {
  autoSendMeasurementProtocol: boolean;
  measurementId: string;
  apiSecret: string;
  sendScrollEvents: boolean;
  sendEngagementEvents: boolean;
  sendSessionEvents: boolean;
}

// ==========================================
// ORGANIC GENERATOR MASTER CONFIG
// ==========================================
export interface OrganicVisitorConfig {
  id: string;
  name: string;
  targetUrl: string;
  crawlSettings: {
    maxDepth: number;
    maxLinks: number;
  };
  organic: OrganicTrafficConfig;
  behavior: VisitorBehaviorConfig;
  fingerprint: AntiFingerprintConfig;
  ga4: Ga4TrackerConfig;
  durationMinutes: number; // total campaign run time
}

// ==========================================
// ACTIVE HUMAN VISITOR LIVE STATE
// ==========================================
export interface VisitedPageStep {
  url: string;
  path: string;
  title: string;
  dwellPlannedSeconds: number;
  dwellSecondsSpent: number;
  scrollDepthPct: number;
  plannedClicks: number;
  clicksPerformed: number;
  lastClickTarget?: string;
  
  // Post article links and ads breakdown
  articleLinksPlanned?: number;
  articleLinksClicked?: number;
  adClicksPlanned?: number;
  adClicksPerformed?: number;
  hasPopupHandled?: boolean;
  hasReloaded?: boolean;
  hasScrolledToEnd?: boolean;
  lastAdClickTarget?: string;

  status: 'visiting' | 'completed' | 'failed';
  startedAt: number;
  endedAt?: number;
}

export interface SimulatorActionLog {
  id: string;
  timestamp: number;
  timeStr: string;
  type: 'mouse_move' | 'scroll' | 'click' | 'dwell' | 'nav' | 'ad_click' | 'popup' | 'reload' | 'ga4_beacon' | 'http_fetch';
  action: string;
  targetElement?: string;
  cursorCoords?: { x: number; y: number };
  scrollPct?: number;
  dwellSec?: number;
  badgeColor?: string;
}

export interface ActiveVisitorSession {
  visitorId: string;
  visitorNumber: number;
  country: GeoCountry;
  ipAddress?: string;
  proxyUsed?: ProxyNode | null;
  deviceType: string;
  userAgent: string;
  screenResolution: string;
  browserVendor: string;
  trafficSource: 'Organic Search' | 'Social' | 'Direct' | 'Referral';
  referrerUrl: string;
  referrerName: string;
  searchKeyword?: string;
  gaClientId: string;
  gaSessionId: string;
  isReturning: boolean;
  isBounced: boolean;
  totalPlannedPages: number;
  currentPageIndex: number;
  visitedPages: VisitedPageStep[];
  currentScrollDepthPct: number;
  cursorX: number; // 0-100% of viewport
  cursorY: number; // 0-100% of viewport
  cursorTrajectory?: Array<{ x: number; y: number; timestamp: number }>;
  currentHoverTarget?: string;
  currentScrollVelocity?: number;
  liveActionLogs?: SimulatorActionLog[];
  status: 'active' | 'reading' | 'scrolling' | 'clicking_link' | 'clicking_element' | 'clicking_ad' | 'handling_popup' | 'reloading_page' | 'transitioning' | 'completed' | 'bounced';
  startedAt: number;
  totalSessionDwellSeconds: number;
  lastEventLog: string;
  hitSequence?: number;
  pageLoadId?: string;
  
  // Aggregate session interactions
  totalArticleLinksClicked?: number;
  totalAdClicks?: number;
  popupInteractions?: number;
  reloadsPerformed?: number;
  footerReached?: boolean;
}

export interface LiveTelemetryEvent {
  id: string;
  timestamp: number;
  visitorId: string;
  countryCode: string;
  countryFlag: string;
  eventType: 'page_view' | 'scroll' | 'user_engagement' | 'session_start' | 'page_click' | 'ad_click' | 'article_link_click' | 'popup_interaction' | 'page_reload' | 'footer_scroll' | 'session_end' | 'bounce';
  pagePath: string;
  pageTitle: string;
  source: string;
  details: string;
  device: string;
  adDetails?: {
    adType: 'banner' | 'popup' | 'native' | 'sticky' | 'sidebar';
    adSlot: string;
    adNetwork: string;
  };
}

export interface OrganicRunSummary {
  id: string;
  campaignName: string;
  targetUrl: string;
  startTime: number;
  endTime: number;
  totalDurationSeconds: number;
  totalVisitorsDispatched: number;
  totalPageViews: number;
  bouncedSessions: number;
  bounceRatePct: number;
  avgEngagementTimeSeconds: number;
  avgPagesPerSession: number;
  sourcesBreakdown: {
    organic: number;
    social: number;
    direct: number;
    referral: number;
  };
  countryDistribution: Record<string, number>;
  topLandingPages: { path: string; title: string; views: number; avgTimeSec: number }[];
  topKeywords: { keyword: string; visits: number }[];
  ga4EventsDispatched: number;
  
  // Ad & In-Article Interactivity Metrics
  totalArticleLinksClicked?: number;
  totalAdClicks?: number;
  totalPopupInteractions?: number;
  fullScrollRatePct?: number;
}

// ==========================================
// LOAD TESTING & API STRESS COMPATIBILITY TYPES
// ==========================================
export interface HeaderPair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ScenarioStep {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: QueryParam[];
  bodyType: 'none' | 'json' | 'form' | 'text';
  bodyContent: string;
  weight: number;
  extractVariables?: {
    varName: string;
    jsonPath: string;
  }[];
  thinkTimeMs: number;
}

export interface LoadProfileConfig {
  pattern: LoadPattern;
  durationSeconds: number;
  targetRps: number;
  initialRps: number;
  peakRps: number;
  rampUpSeconds: number;
  rampDownSeconds: number;
  spikeIntervalSeconds: number;
  spikeDurationSeconds: number;
  chaosJitterPct: number;
  concurrencyLimit: number;
  timeoutMs: number;
}

export interface DeviceDistribution {
  desktopChrome: number;
  desktopSafari: number;
  mobileIos: number;
  mobileAndroid: number;
  botCrawler: number;
}

export interface PersonaConfig {
  devices: DeviceDistribution;
  regions: {
    region: string;
    weight: number;
    simulatedLatencyMs: number;
  }[];
  enableKeepAlive: boolean;
  followRedirects: boolean;
  randomizeIp: boolean;
}

export interface SlaAssertion {
  id: string;
  metric: 'p90_latency' | 'p95_latency' | 'p99_latency' | 'avg_latency' | 'error_rate' | 'success_rate' | 'min_rps';
  operator: '<' | '<=' | '>' | '>=';
  threshold: number;
  description: string;
}

export interface TrafficConfig {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  method: HttpMethod;
  engineMode: EngineMode;
  headers: HeaderPair[];
  params: QueryParam[];
  bodyType: 'none' | 'json' | 'form' | 'text';
  bodyContent: string;
  loadProfile: LoadProfileConfig;
  persona: PersonaConfig;
  steps: ScenarioStep[];
  isMultiStep: boolean;
  assertions: SlaAssertion[];
}

export interface RequestMetricLog {
  id: string;
  timestamp: number;
  stepName: string;
  method: HttpMethod;
  url: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  dnsMs?: number;
  ttfbMs?: number;
  downloadMs?: number;
  responseBytes: number;
  success: boolean;
  error?: string;
  region?: string;
  userAgent?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  responsePreview?: string;
}

export interface MetricSnapshot {
  timestamp: number;
  timeLabel: string;
  currentRps: number;
  targetRps: number;
  activeVus: number;
  avgLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  errors: number;
  bytesPerSec: number;
}

export interface RunSummary {
  id: string;
  testName: string;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgRps: number;
  peakRps: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalBytesTransferred: number;
  statusCodeCounts: Record<number, number>;
  assertionResults: {
    assertion: SlaAssertion;
    passed: boolean;
    actualValue: number;
  }[];
  allPassed: boolean;
  snapshots: MetricSnapshot[];
  logsSample: RequestMetricLog[];
  aiAnalysis?: string;
}

export type TestStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

// ==========================================
// MEMBER AUTHENTICATION & MEMBERSHIP TYPES
// ==========================================
export type MemberTier = 'starter' | 'pro' | 'enterprise';

export interface MemberUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  company?: string;
  targetWebsite?: string;
  tier: MemberTier;
  role: 'member' | 'admin' | 'guest';
  customVisitsLimit?: number; // 0 or undefined = unlimited
  maxConcurrentVUs?: number;
  totalCampaignsRun: number;
  totalVisitsGenerated: number;
  joinedAt: number;
  lastLoginAt: number;
  isVerified: boolean;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: MemberUser | null;
  token: string | null;
}
