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
    // 1. High-speed local server proxy (direct backend relay) + CORS proxy fallbacks
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(url)}`,
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

  if (crawlResult.pages.length <= 1) {
    const fallback = getClientSideCrawledPages(targetUrl);
    return {
      title: crawlResult.title || `${new URL(targetUrl).hostname} - Catalog`,
      description: crawlResult.description || `Verified routes for ${targetUrl}`,
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
 * Domain-isolated clean fallback catalog for the given domain hostname
 * Never fabricates fake career or ecommerce routes.
 */
export function getClientSideCrawledPages(targetUrl: string): CrawledPage[] {
  let hostname = 'target-site.com';
  let rootOrigin = 'https://target-site.com';
  let initialPath = '/';
  try {
    if (targetUrl.startsWith('http')) {
      const u = new URL(targetUrl);
      hostname = u.hostname;
      rootOrigin = u.origin;
      initialPath = u.pathname || '/';
    } else {
      hostname = targetUrl.replace(/\/.*$/, '');
      rootOrigin = 'https://' + hostname;
    }
  } catch {}

  const pages: CrawledPage[] = [
    {
      id: 'page_root',
      url: `${rootOrigin}/`,
      path: '/',
      title: `${hostname} - Home`,
      description: `Target landing page for ${hostname}`,
      depth: 0,
      status: 200,
      includedInVisits: true,
      visitWeight: 100,
      gaDetected: false,
      category: 'page',
    },
  ];

  if (initialPath && initialPath !== '/') {
    pages.push({
      id: 'page_target',
      url: `${rootOrigin}${initialPath}`,
      path: initialPath,
      title: `${hostname} - ${initialPath.replace(/^\//, '')}`,
      description: `Target page ${initialPath}`,
      depth: initialPath.split('/').filter(Boolean).length,
      status: 200,
      includedInVisits: true,
      visitWeight: 95,
      gaDetected: false,
      category: 'post',
    });
  }

  return pages;
}
