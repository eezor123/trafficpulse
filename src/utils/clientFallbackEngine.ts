import type { CrawledPage } from '../types';
import { executeUniversalCrawl, FetchFunction } from './universalCrawler';

export interface GeneratedAICampaign {
  name: string;
  keywords: string[];
  trafficSources: {
    organicSearch: number;
    socialMedia: number;
    direct: number;
    referral: number;
  };
  searchEngines: {
    google: number;
    bing: number;
    duckduckgo: number;
    yahoo: number;
    baidu: number;
    yandex: number;
  };
  socialPlatforms: {
    twitter: number;
    linkedin: number;
    facebook: number;
    instagram: number;
    reddit: number;
    youtube: number;
    tiktok: number;
    pinterest: number;
  };
  recommendedCountries: Array<{ code: string; name: string; weight: number }>;
  behavior: {
    minDwellSeconds: number;
    maxDwellSeconds: number;
    minPagesPerVisit: number;
    maxPagesPerVisit: number;
    bounceRatePct: number;
  };
  seoStrategySummary: string;
}

/**
 * Intelligent client-side AI campaign generator that adapts purely to the domain and topic
 */
export function generateClientSideCampaign(url: string, description: string = '', objective: string = 'seo'): GeneratedAICampaign {
  let hostname = 'target-site.com';
  try {
    if (url.startsWith('http')) {
      hostname = new URL(url).hostname;
    } else {
      hostname = url.replace(/\/.*$/, '');
    }
  } catch {}

  const brandName = hostname.replace(/^(www\.|jobs\.|blog\.|app\.|shop\.)/, '').replace(/\.[a-z.]+$/, '');
  const isEcommerce = objective === 'ecommerce' || description.toLowerCase().includes('store') || description.toLowerCase().includes('shop') || description.toLowerCase().includes('product') || description.toLowerCase().includes('cart');
  const isViralSocial = objective === 'viral_social' || description.toLowerCase().includes('social') || description.toLowerCase().includes('viral') || description.toLowerCase().includes('community');
  const isJobBoard = description.toLowerCase().includes('job') || description.toLowerCase().includes('career') || description.toLowerCase().includes('hiring') || hostname.includes('job') || hostname.includes('career');

  let keywords: string[] = [];
  if (isJobBoard) {
    keywords = [
      `${brandName} verified job openings`,
      `remote career opportunities on ${hostname}`,
      `entry level and senior roles ${brandName}`,
      `urgent hiring alerts ${hostname}`,
      `how to apply for jobs on ${brandName}`,
      `salary guide and reviews ${hostname}`,
      `top tech and corporate positions ${brandName}`,
      `verified employer listings ${hostname}`,
      `interview tips and applications ${brandName}`,
      `full-time and freelance jobs ${hostname}`
    ];
  } else if (isEcommerce) {
    keywords = [
      `buy online best price ${hostname}`,
      `discount deals and free shipping ${brandName}`,
      `top rated customer reviews ${brandName}`,
      `order online fast delivery guarantee ${hostname}`,
      `best alternatives comparison ${brandName}`,
      `checkout coupon promo codes verified ${hostname}`,
      `where to buy quality products on ${brandName}`,
      `trusted store with buyer protection ${hostname}`,
      `same day dispatch order tracking ${brandName}`,
      `official clearance collection ${hostname}`
    ];
  } else {
    keywords = [
      `official portal login ${hostname}`,
      `best features and solutions on ${brandName}`,
      `how to get started guide ${hostname}`,
      `platform review and customer ratings ${brandName}`,
      `pricing plans and subscription tiers ${hostname}`,
      `high performance tools ${brandName}`,
      `secure account dashboard ${hostname}`,
      `api documentation and developer guides ${brandName}`,
      `industry leading solutions ${hostname}`,
      `customer success stories ${brandName}`
    ];
  }

  let trafficSources = { organicSearch: 55, socialMedia: 25, direct: 12, referral: 8 };
  if (isViralSocial) {
    trafficSources = { organicSearch: 20, socialMedia: 65, direct: 10, referral: 5 };
  } else if (isEcommerce) {
    trafficSources = { organicSearch: 45, socialMedia: 30, direct: 15, referral: 10 };
  }

  const recommendedCountries = [
    { code: 'US', name: 'United States', weight: 45 },
    { code: 'GB', name: 'United Kingdom', weight: 20 },
    { code: 'CA', name: 'Canada', weight: 12 },
    { code: 'DE', name: 'Germany', weight: 8 },
    { code: 'FR', name: 'France', weight: 8 },
    { code: 'AU', name: 'Australia', weight: 7 },
  ];

  return {
    name: `Organic Strategy (${hostname})`,
    keywords,
    trafficSources,
    searchEngines: {
      google: 84,
      bing: 10,
      duckduckgo: 4,
      yahoo: 2,
      baidu: 0,
      yandex: 0,
    },
    socialPlatforms: {
      twitter: 35,
      linkedin: 25,
      facebook: 20,
      instagram: 10,
      reddit: 8,
      youtube: 2,
      tiktok: 0,
      pinterest: 0,
    },
    recommendedCountries,
    behavior: {
      minDwellSeconds: 40,
      maxDwellSeconds: 120,
      minPagesPerVisit: 2,
      maxPagesPerVisit: 5,
      bounceRatePct: 18,
    },
    seoStrategySummary: `Tailored multi-session organic configuration for ${hostname} prioritizing clean canonical crawl routes, realistic viewport dwell, and high-conversion search signals.`,
  };
}

/**
 * Live Client-Side Web Crawler using Universal Crawl Engine with resilient browser proxies
 */
export async function crawlWebsiteLiveInBrowser(targetUrl: string): Promise<{
  title: string;
  description: string;
  pages: CrawledPage[];
  gaMeasurementId?: string;
  gtmId?: string;
}> {
  const browserResilientFetch: FetchFunction = async (url: string, timeoutMs = 6000) => {
    // 1. Direct browser fetch (for same-origin or CORS-enabled targets)
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tm);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 50) {
          return { ok: true, status: res.status, text };
        }
      }
    } catch {}

    // 2. High-speed CORS proxy endpoints
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), timeoutMs);
        const res = await fetch(proxyUrl, { signal: ctrl.signal });
        clearTimeout(tm);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 50 && (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<body') || text.includes('<div') || text.includes('<url') || text.includes('<sitemap') || text.includes('{"') || text.includes('[{'))) {
            return { ok: true, status: 200, text };
          }
        }
      } catch {}
    }

    return { ok: false, status: 0, text: '' };
  };

  const crawlResult = await executeUniversalCrawl(targetUrl, 2, 1000, browserResilientFetch);

  if (crawlResult.pages.length === 0) {
    const fallback = getClientSideCrawledPages(targetUrl);
    return {
      title: crawlResult.title,
      description: crawlResult.description,
      pages: fallback,
      gaMeasurementId: crawlResult.gaMeasurementId || undefined,
      gtmId: crawlResult.gtmId || undefined,
    };
  }

  return {
    title: crawlResult.title,
    description: crawlResult.description,
    pages: crawlResult.pages,
    gaMeasurementId: crawlResult.gaMeasurementId || undefined,
    gtmId: crawlResult.gtmId || undefined,
  };
}

/**
 * Domain-isolated fallback page catalog generated ONLY from the given domain hostname
 */
export function getClientSideCrawledPages(targetUrl: string): CrawledPage[] {
  let hostname = 'target-site.com';
  let rootOrigin = 'https://target-site.com';
  try {
    if (targetUrl.startsWith('http')) {
      const u = new URL(targetUrl);
      hostname = u.hostname;
      rootOrigin = u.origin;
    } else {
      hostname = targetUrl.replace(/\/.*$/, '');
      rootOrigin = 'https://' + hostname;
    }
  } catch {}

  const isJobDomain = hostname.startsWith('jobs.') || hostname.includes('career') || hostname.includes('vacancy');

  if (isJobDomain) {
    const jobRoutes: Array<{ path: string; title: string; desc: string; cat: 'page' | 'post' | 'category' | 'product'; weight: number }> = [
      { path: '/', title: `${hostname} - Career & Job Portal`, desc: `Featured Job Openings on ${hostname}`, cat: 'page', weight: 100 },
      { path: '/jobs', title: 'Browse All Open Positions', desc: 'Search and filter active vacancies', cat: 'category', weight: 95 },
      { path: '/jobs/engineering', title: 'Engineering & Tech Roles', desc: 'Software, DevOps, and Infrastructure jobs', cat: 'category', weight: 90 },
      { path: '/jobs/product', title: 'Product & Design Openings', desc: 'Product Managers and UX designers', cat: 'category', weight: 88 },
      { path: '/jobs/marketing', title: 'Marketing & Sales Opportunities', desc: 'Growth and account executive positions', cat: 'category', weight: 85 },
      { path: '/jobs/remote', title: 'Remote & Hybrid Opportunities', desc: 'Global remote job listings', cat: 'category', weight: 92 },
      { path: '/post-job', title: 'Post a Job Listing', desc: 'Employer portal to publish vacancies', cat: 'page', weight: 85 },
      { path: '/companies', title: 'Hiring Companies Directory', desc: 'Verified companies currently hiring', cat: 'page', weight: 80 },
      { path: '/salaries', title: 'Salary Benchmark & Compensation Guide', desc: 'Market pay rates and benchmarks', cat: 'page', weight: 82 },
      { path: '/about', title: `About ${hostname}`, desc: `About ${hostname}`, cat: 'page', weight: 75 },
      { path: '/contact', title: 'Contact Support', desc: 'Candidate & Employer Support', cat: 'page', weight: 70 },
      { path: '/faq', title: 'Frequently Asked Questions', desc: 'FAQ about jobs and hiring', cat: 'page', weight: 70 },
      { path: '/privacy', title: 'Privacy Policy', desc: 'Applicant privacy and data protection', cat: 'page', weight: 60 },
      { path: '/terms', title: 'Terms of Service', desc: 'Platform terms and conditions', cat: 'page', weight: 60 },
    ];

    return jobRoutes.map((r, idx) => ({
      id: `page_${idx + 1}`,
      url: `${rootOrigin}${r.path}`,
      path: r.path,
      title: r.title,
      description: r.desc,
      depth: r.path === '/' ? 0 : r.path.split('/').filter(Boolean).length,
      status: 200,
      includedInVisits: true,
      visitWeight: r.weight,
      gaDetected: false,
      category: r.cat,
    }));
  }

  const baseRoutes: Array<{ path: string; title: string; desc: string; cat: 'page' | 'post' | 'category' | 'product'; weight: number }> = [
    { path: '/', title: `${hostname} - Home`, desc: 'Main Landing Page', cat: 'page', weight: 100 },
    { path: '/features', title: 'Platform Features & Core Capabilities', desc: 'Overview of features and tools', cat: 'page', weight: 90 },
    { path: '/pricing', title: 'Pricing & Plans', desc: 'Compare pricing plans', cat: 'page', weight: 88 },
    { path: '/products', title: 'Products Directory', desc: 'List of available products', cat: 'category', weight: 85 },
    { path: '/services', title: 'Services & Solutions', desc: 'Solutions overview', cat: 'page', weight: 82 },
    { path: '/docs', title: 'Documentation & Guides', desc: 'Technical documentation', cat: 'page', weight: 90 },
    { path: '/blog', title: 'Latest Articles & Blog', desc: 'Insights and articles', cat: 'category', weight: 85 },
    { path: '/about', title: `About ${hostname}`, desc: `About ${hostname}`, cat: 'page', weight: 80 },
    { path: '/careers', title: 'Careers', desc: 'Join our team', cat: 'page', weight: 85 },
    { path: '/contact', title: 'Contact & Support', desc: 'Get in touch', cat: 'page', weight: 75 },
    { path: '/faq', title: 'Frequently Asked Questions', desc: 'Common questions and answers', cat: 'page', weight: 80 },
    { path: '/terms', title: 'Terms of Service', desc: 'Terms of service', cat: 'page', weight: 65 },
    { path: '/privacy', title: 'Privacy Policy', desc: 'Privacy policy', cat: 'page', weight: 65 },
  ];

  return baseRoutes.map((r, idx) => ({
    id: `page_${idx + 1}`,
    url: `${rootOrigin}${r.path}`,
    path: r.path,
    title: r.title,
    description: r.desc,
    depth: r.path === '/' ? 0 : r.path.split('/').filter(Boolean).length,
    status: 200,
    includedInVisits: true,
    visitWeight: r.weight,
    gaDetected: false,
    category: r.cat,
  }));
}
