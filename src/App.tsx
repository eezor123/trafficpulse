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
import { TRAFFIC_PRESETS } from './data/presets';
import { 
  ActiveVisitorSession,
  CrawledPage,
  LiveTelemetryEvent,
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
  RotateCcw
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
        fingerprint: { ...DEFAULT_ORGANIC_CONFIG.fingerprint, ...(parsed.fingerprint || {}) },
        ga4: { ...DEFAULT_ORGANIC_CONFIG.ga4, ...(parsed.ga4 || {}) },
        crawlSettings: { ...DEFAULT_ORGANIC_CONFIG.crawlSettings, ...(parsed.crawlSettings || {}) },
      };
    }
  } catch (e) {
    console.warn('Failed to load saved organic config:', e);
  }
  return DEFAULT_ORGANIC_CONFIG;
}

const DEFAULT_CRAWLED_PAGES: CrawledPage[] = [
  {
    id: 'page_root',
    url: 'https://9jajobs.vercel.app/',
    path: '/',
    title: 'NaijaJobs - Escrow Job Marketplace',
    description: 'Main portal for 9jajobs.vercel.app',
    depth: 0,
    status: 200,
    includedInVisits: true,
    visitWeight: 100,
    gaDetected: true,
    category: 'page'
  },
  {
    id: 'spa_job_101',
    url: 'https://9jajobs.vercel.app/?job=job_101',
    path: '/?job=job_101',
    title: 'Mobile App Developer for Dispatch Rider Tracking System',
    description: '[Job Listing] Lagos Express Parcel Ltd • Mobile App Development',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_102',
    url: 'https://9jajobs.vercel.app/?job=job_102',
    path: '/?job=job_102',
    title: 'Brand Identity & Web UI/UX for Abuja Federal Contractor Portal',
    description: '[Job Listing] PrimeEdge Consult • Graphic Design & UI/UX',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_103',
    url: 'https://9jajobs.vercel.app/?job=job_103',
    path: '/?job=job_103',
    title: '15kVA Commercial Solar & Lithium Battery Setup in Trans-Amadi',
    description: '[Job Listing] Horizon Cold Storage Ltd • Solar Energy Systems',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_104',
    url: 'https://9jajobs.vercel.app/?job=job_104',
    path: '/?job=job_104',
    title: 'Tax Compliance & Audit Specialist for Enugu Tech Startup',
    description: '[Job Listing] CoalCity Pay Ltd • Accounting & Financial Consulting',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_105',
    url: 'https://9jajobs.vercel.app/?job=job_105',
    path: '/?job=job_105',
    title: 'Urgently Needed: Full-Stack Next.js & Stripe/Paystack Engineer',
    description: '[Job Listing] AfriRemit FinTech • Software & Web Engineering',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_106',
    url: 'https://9jajobs.vercel.app/?job=job_106',
    path: '/?job=job_106',
    title: 'Social Media Content Creator & Video Editor for Skincare Brand',
    description: '[Job Listing] GlowNaturals NG • Digital Marketing & Content',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_107',
    url: 'https://9jajobs.vercel.app/?job=job_107',
    path: '/?job=job_107',
    title: 'Flutterwave & Monnify Virtual Account Payment Specialist',
    description: '[Job Listing] NaijaSub VTU Services • FinTech Integrations',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_108',
    url: 'https://9jajobs.vercel.app/?job=job_108',
    path: '/?job=job_108',
    title: 'Corporate Legal Advisor for Tech Startup Incorporation & NDPR',
    description: '[Job Listing] Apex Chambers & Partners • Legal Advisory',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_109',
    url: 'https://9jajobs.vercel.app/?job=job_109',
    path: '/?job=job_109',
    title: 'Executive Real Estate Architectural Renderings & 3D Flythrough',
    description: '[Job Listing] Haven Ridge Properties • 3D Architectural Design',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_110',
    url: 'https://9jajobs.vercel.app/?job=job_110',
    path: '/?job=job_110',
    title: 'Hospitality CCTV & Biometric Access Control Installation Lead',
    description: '[Job Listing] Grand View Continental Hotel • Security Systems',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_111',
    url: 'https://9jajobs.vercel.app/?job=job_111',
    path: '/?job=job_111',
    title: 'High-Scale PostgreSQL Database Administrator & Query Optimization Specialist',
    description: '[Job Listing] DataBridge Systems • Database Engineering',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_112',
    url: 'https://9jajobs.vercel.app/?job=job_112',
    path: '/?job=job_112',
    title: 'E-commerce SEO Audit & Conversion Rate Optimization (CRO)',
    description: '[Job Listing] Zikora Fashion House • Search Engine Optimization',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_113',
    url: 'https://9jajobs.vercel.app/?job=job_113',
    path: '/?job=job_113',
    title: 'Solar Inverter System Installation & Farm Automation Control',
    description: '[Job Listing] AgroGreen Farms Ibadan • Renewable Energy & IoT',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_114',
    url: 'https://9jajobs.vercel.app/?job=job_114',
    path: '/?job=job_114',
    title: 'Textile E-commerce Store & Hausa Multi-language UI Development',
    description: '[Job Listing] Arewa Wears Kano • Frontend Localization',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_115',
    url: 'https://9jajobs.vercel.app/?job=job_115',
    path: '/?job=job_115',
    title: 'Offshore Logistics Fleet Tracking & Petroleum Inventory Dashboard',
    description: '[Job Listing] Niger Delta Maritime Energy • Fleet Tracking',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_116',
    url: 'https://9jajobs.vercel.app/?job=job_116',
    path: '/?job=job_116',
    title: 'Hospitality Management Software & POS Integration for Owerri Hotel',
    description: '[Job Listing] Heritage Suites Owerri • POS & Hotel Software',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_barbecue',
    url: 'https://9jajobs.vercel.app/?job=job_1787164089747',
    path: '/?job=job_1787164089747',
    title: 'Male Barbecue sales person is urgently needed',
    description: '[Job Listing] Direct Escrow Listing • Sales & Food Service',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_job_solar_inv',
    url: 'https://9jajobs.vercel.app/?job=job_1785681865131',
    path: '/?job=job_1785681865131',
    title: 'Solar Inverter System Installation & Farm Automation Control',
    description: '[Job Listing] Farm Automation & Solar Installation Lead',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 95,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_101',
    url: 'https://9jajobs.vercel.app/?job=art_101',
    path: '/?job=art_101',
    title: '10 Proven Tips to Ace High-Paying Job Interviews in Nigeria',
    description: '[Career Article] Interview Preparation Guide',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_102',
    url: 'https://9jajobs.vercel.app/?job=art_102',
    path: '/?job=art_102',
    title: 'How to Build an ATS-Friendly CV That Nigerian HRs Love in 2026',
    description: '[Career Article] ATS Resume & CV Optimization',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_103',
    url: 'https://9jajobs.vercel.app/?job=art_103',
    path: '/?job=art_103',
    title: 'Top 8 High-Demand Remote Tech Skills for Nigerians',
    description: '[Career Article] Remote Work & International Freelancing',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_104',
    url: 'https://9jajobs.vercel.app/?job=art_104',
    path: '/?job=art_104',
    title: 'Salary Negotiation Strategies in the Nigerian Tech & Oil Sectors',
    description: '[Career Article] Salary & Compensation Negotiation',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_105',
    url: 'https://9jajobs.vercel.app/?job=art_105',
    path: '/?job=art_105',
    title: 'Navigating NYSC Service Year to Land Your First Corporate Job',
    description: '[Career Article] Fresh Graduate & NYSC Career Growth',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'spa_art_106',
    url: 'https://9jajobs.vercel.app/?job=art_106',
    path: '/?job=art_106',
    title: 'Freelancing vs Full-Time Jobs: Choosing Your Career Path in Nigeria',
    description: '[Career Article] Freelance vs Corporate Career Advice',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'post'
  },
  {
    id: 'cat_mobile',
    url: 'https://9jajobs.vercel.app/category/mobile-app-development',
    path: '/category/mobile-app-development',
    title: 'Mobile App Development (Job Category)',
    description: 'Category: React Native, Flutter, Swift, Kotlin Jobs',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'cat_design',
    url: 'https://9jajobs.vercel.app/category/graphic-design-ui-ux',
    path: '/category/graphic-design-ui-ux',
    title: 'Graphic Design & UI/UX (Job Category)',
    description: 'Category: Figma, Brand Identity, Motion Graphics',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'cat_solar',
    url: 'https://9jajobs.vercel.app/category/solar-energy-electrical-systems',
    path: '/category/solar-energy-electrical-systems',
    title: 'Solar Energy & Electrical Systems (Job Category)',
    description: 'Category: Commercial Solar, Inverters, Battery Setup',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'cat_finance',
    url: 'https://9jajobs.vercel.app/category/accounting-financial-consulting',
    path: '/category/accounting-financial-consulting',
    title: 'Accounting & Financial Consulting (Job Category)',
    description: 'Category: Tax Compliance, FIRS TCC, Audits',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'cat_engineering',
    url: 'https://9jajobs.vercel.app/category/software-web-engineering',
    path: '/category/software-web-engineering',
    title: 'Software & Web Engineering (Job Category)',
    description: 'Category: Full-Stack, Next.js, Node.js, Python',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'cat_marketing',
    url: 'https://9jajobs.vercel.app/category/digital-marketing-content',
    path: '/category/digital-marketing-content',
    title: 'Digital Marketing & Content (Job Category)',
    description: 'Category: Social Media, Video Editing, SEO, Ads',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 85,
    gaDetected: true,
    category: 'category'
  },
  {
    id: 'page_jobs',
    url: 'https://9jajobs.vercel.app/jobs',
    path: '/jobs',
    title: 'Browse All Jobs & Escrow Listings',
    description: 'Search and filter all available opportunities',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 90,
    gaDetected: true,
    category: 'page'
  },
  {
    id: 'page_freelancers',
    url: 'https://9jajobs.vercel.app/freelancers',
    path: '/freelancers',
    title: 'Find Top Verified Freelancers',
    description: 'Hire verified Nigerian experts with escrow protection',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 80,
    gaDetected: true,
    category: 'page'
  },
  {
    id: 'page_escrow',
    url: 'https://9jajobs.vercel.app/escrow',
    path: '/escrow',
    title: 'Escrow Protection & Milestone Security',
    description: 'How fund security and milestone releases work',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 75,
    gaDetected: true,
    category: 'page'
  },
  {
    id: 'page_safety',
    url: 'https://9jajobs.vercel.app/safety',
    path: '/safety',
    title: 'Trust, Safety & Dispute Resolution',
    description: 'Verification standards, BVN/NIN checks, and buyer safety',
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 70,
    gaDetected: true,
    category: 'page'
  }
];

function loadInitialCrawlState(): SiteCrawlState {
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
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CRAWL_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that saved state is not old example.com or small sample
      if (
        parsed && 
        Array.isArray(parsed.pages) && 
        parsed.pages.length >= 25 &&
        parsed.hostname !== 'example.com' &&
        !parsed.pages.some((p: any) => p.id === 'p_root' || p.id === 'p_features')
      ) {
        return { ...defaultCrawl, ...parsed, isCrawling: false };
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

  // ==================== AUTO-PERSISTENCE TO LOCALSTORAGE ====================
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

    setCrawlState(prev => ({ 
      ...prev, 
      targetUrl: urlToCrawl,
      isCrawling: true, 
      error: undefined 
    }));
    setOrganicConfig(prev => ({ ...prev, targetUrl: urlToCrawl }));

    try {
      const res = await fetch('/api/crawler/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToCrawl,
          targetUrl: urlToCrawl,
          maxDepth: organicConfig.crawlSettings.maxDepth || 2,
          maxLinks: Math.max(300, organicConfig.crawlSettings.maxLinks || 300),
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Crawler request failed with status ${res.status}`);
      }

      if (data.pages && data.pages.length > 0) {
        // Retain any user-custom-added pages so they are never lost on re-scrape
        const existingCustomPages = crawlState.pages.filter(p => p.id.startsWith('custom_') || p.id.startsWith('user_'));
        const existingCustomPaths = new Set(data.pages.map((p: any) => p.path));
        const retainedCustom = existingCustomPages.filter(p => !existingCustomPaths.has(p.path));
        const mergedPages = [...retainedCustom, ...data.pages];

        setCrawlState({
          targetUrl: data.targetUrl || urlToCrawl,
          hostname: data.hostname || (urlToCrawl.startsWith('/') ? 'Local Sandbox' : new URL(urlToCrawl).hostname),
          title: data.title || 'Discovered Website',
          pages: mergedPages,
          isCrawling: false,
          gaMeasurementId: data.gaMeasurementId,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          realLinksCount: data.realLinksCount,
        });

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
      console.warn('Crawler notice:', err.message);
      setCrawlState(prev => ({ ...prev, isCrawling: false, error: err.message }));
      return [];
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

  const handleRemovePage = (pageId: string) => {
    setCrawlState(prev => ({
      ...prev,
      pages: prev.pages.filter(p => p.id !== pageId),
    }));
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

    let pagesToUse = crawlState.pages;
    const targetUrl = organicConfig.targetUrl || crawlState.targetUrl;

    // If pages are still the initial sample pages or the domain changed, autonomously crawl all posts first!
    if (
      crawlState.pages.some(p => p.id.startsWith('p_root')) || 
      crawlState.targetUrl !== targetUrl || 
      crawlState.pages.length <= 5
    ) {
      const scraped = await handleStartCrawl(targetUrl);
      if (scraped && scraped.length > 0) {
        pagesToUse = scraped;
      }
    }

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

    const engine = new OrganicTrafficEngine(organicConfig, pagesToUse, {
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
      },
      onError: (err) => {
        console.error('Organic Engine error:', err);
        setOrganicStatus('error');
      },
    });

    organicEngineRef.current = engine;
    engine.start();
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
      const data = await res.json();
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
      console.warn('AI keywords generation notice:', err);
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
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
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
                onRemovePage={handleRemovePage}
                onAutoPopulateRoutes={handleAutoPopulateRoutes}
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
    </div>
  );
}
